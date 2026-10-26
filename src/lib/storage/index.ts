import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import { env } from "@/lib/env";

/**
 * Storage abstraction — the single seam between the CMS and the image store.
 *
 * The PRD targets Cloudflare R2 in production. Everything above this
 * interface (upload API, media service, seed data) only ever speaks in
 * storage keys and public URLs, so switching to R2 means adding one driver
 * — no other layer changes. See `docs/DEPLOYMENT.md` for the R2 driver notes.
 *
 *   key      → stable object identifier, e.g. "products/1729-sofa.webp"
 *   publicUrl→ URL browsers use to display the object
 */

export interface StorageDriver {
  /** Persist bytes under a key and return its public URL. */
  put(key: string, data: Buffer, contentType: string): Promise<string>;
  /** Read an object. Returns null when it does not exist. */
  get(key: string): Promise<Buffer | null>;
  /** Remove an object. Missing objects are treated as already deleted. */
  delete(key: string): Promise<void>;
  /** Public URL for an existing key. */
  publicUrl(key: string): string;
}

/**
 * Local disk driver (development + this sandbox).
 *
 * Objects live under the configured uploads directory and are served through
 * the `/api/media/[...key]` route, which mirrors how an R2-backed public URL
 * behaves (an HTTP fetch, not a build-time asset) — so templates and `<img>`
 * usage need no changes when the driver swaps.
 */
class LocalDiskStorage implements StorageDriver {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.isAbsolute(root) ? root : path.join(process.cwd(), root);
  }

  private resolve(key: string): string | null {
    // Defence-in-depth: normalise, then refuse any key that escapes the root
    // (blocks "../" traversal) — structure-preserving, unlike a flat join.
    const rootPath = path.resolve(this.root);
    const filePath = path.resolve(rootPath, key);
    if (filePath !== rootPath && !filePath.startsWith(rootPath + path.sep)) {
      return null;
    }
    return filePath;
  }

  async put(key: string, data: Buffer, _contentType: string): Promise<string> {
    const filePath = this.resolve(key);
    if (!filePath) throw new Error(`Invalid storage key: ${key}`);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    return this.publicUrl(key);
  }

  async get(key: string): Promise<Buffer | null> {
    const filePath = this.resolve(key);
    if (!filePath) return null;
    try {
      return await readFile(filePath);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolve(key);
    if (!filePath) return;
    await unlink(filePath).catch(() => undefined);
  }

  publicUrl(key: string): string {
    return `/api/media/${key}`;
  }
}

/**
 * R2 / S3-compatible driver (production — Netlify, Vercel, VPS, …).
 *
 * Speaks the S3 REST API with AWS Signature V4 via `aws4fetch`, which works
 * on any standard Node runtime. Cloudflare R2 exposes exactly this API, so
 * no vendor SDK is needed; `R2_ENDPOINT` can also point at MinIO, AWS S3 or
 * Backblaze B3 for testing/self-hosting.
 *
 * Required env when STORAGE_DRIVER=r2:
 *   R2_ACCOUNT_ID                     → endpoint https://<id>.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID / R2_SECRET      → R2 API token (Manage API tokens)
 *   R2_BUCKET                         → bucket name
 *   NEXT_PUBLIC_STORAGE_PUBLIC_BASE   → public URL of the bucket (custom
 *                                       domain or r2.dev) — images are served
 *                                       straight from there, never through /api.
 */
class R2Storage implements StorageDriver {
  private readonly client: AwsClient;
  private readonly objectBase: string; // endpoint/bucket
  private readonly publicBase: string;

  constructor() {
    const missing = (
      [
        ["R2_ACCOUNT_ID", env.r2AccountId],
        ["R2_ACCESS_KEY_ID", env.r2AccessKeyId],
        ["R2_SECRET_ACCESS_KEY", env.r2SecretAccessKey],
        ["R2_BUCKET", env.r2Bucket],
      ] as const
    )
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        `Missing environment variables for STORAGE_DRIVER=r2: ${missing.join(", ")}. ` +
          "Set them in your hosting provider's environment settings (see docs/DEPLOYMENT.md).",
      );
    }

    this.publicBase = env.storagePublicBase;
    if (!/^https?:\/\//i.test(this.publicBase)) {
      throw new Error(
        "When STORAGE_DRIVER=r2, NEXT_PUBLIC_STORAGE_PUBLIC_BASE must be the bucket's public " +
          "http(s) URL (e.g. https://images.skfurniture.in) — images are served from there directly.",
      );
    }

    const endpoint = env.r2Endpoint || `https://${env.r2AccountId}.r2.cloudflarestorage.com`;
    this.objectBase = `${endpoint}/${env.r2Bucket}`;
    this.client = new AwsClient({
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey,
      service: "s3",
      region: "auto",
    });
  }

  /** Percent-encode each key segment (keys are admin-generated slugs, this is defence-in-depth). */
  private objectUrl(key: string): string {
    const encoded = key.split("/").map(encodeURIComponent).join("/");
    return `${this.objectBase}/${encoded}`;
  }

  private async throwOnFailure(response: Response, action: string, key: string): Promise<void> {
    if (response.ok) return;
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 300);
    } catch {
      // body already consumed or unreadable — ignore
    }
    throw new Error(
      `Storage ${action} failed for "${key}": HTTP ${response.status}${detail ? ` — ${detail}` : ""}`,
    );
  }

  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    const response = await this.client.fetch(this.objectUrl(key), {
      method: "PUT",
      body: new Uint8Array(data),
      headers: { "content-type": contentType },
    });
    await this.throwOnFailure(response, "upload", key);
    return this.publicUrl(key);
  }

  async get(_key: string): Promise<Buffer | null> {
    // Objects are served directly from the public bucket URL; the app itself
    // never proxies R2 bytes (unlike the local driver's /api/media route).
    return null;
  }

  async delete(key: string): Promise<void> {
    const response = await this.client.fetch(this.objectUrl(key), { method: "DELETE" });
    if (response.status === 404) return; // already gone — treat as success
    await this.throwOnFailure(response, "delete", key);
  }

  publicUrl(key: string): string {
    return `${this.publicBase.replace(/\/$/, "")}/${key}`;
  }
}

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (!driver) {
    driver = env.storageDriver === "r2" ? new R2Storage() : new LocalDiskStorage(env.uploadsDir);
  }
  return driver;
}

/** Test helper — never used by application code. */
export function __resetStorageForTests(): void {
  driver = null;
}

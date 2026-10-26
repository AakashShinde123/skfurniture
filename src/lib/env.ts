/**
 * Centralised environment configuration.
 *
 * Every process-level configuration value is read here exactly once and
 * exposed with a typed, defaulted interface. Application code must never
 * call `process.env` directly — that keeps deployment targets (local dev,
 * Cloudflare Workers, staging) swappable from one file.
 */

function str(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function int(key: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  /** Public base URL of the site (no trailing slash). Used for canonical URLs, sitemap and WhatsApp links. */
  siteUrl: str("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(/\/$/, ""),

  /** Root folder where uploaded/optimised images are stored by the local storage driver. */
  uploadsDir: str("UPLOADS_DIR", "uploads"),

  /** Maximum accepted upload size in megabytes. */
  maxUploadMb: int("MAX_UPLOAD_MB", 8),

  /** Active storage driver: "local" (disk) or "r2" (Cloudflare R2 / any S3-compatible, production). */
  storageDriver: str("STORAGE_DRIVER", "local") as "local" | "r2",

  // -- R2 / S3-compatible object storage (only required when storageDriver = "r2") --
  /** Cloudflare account ID — used to build the default S3 endpoint. */
  r2AccountId: str("R2_ACCOUNT_ID", ""),
  /** R2 API token access key (create in Cloudflare dashboard → R2 → Manage API tokens). */
  r2AccessKeyId: str("R2_ACCESS_KEY_ID", ""),
  /** R2 API token secret. */
  r2SecretAccessKey: str("R2_SECRET_ACCESS_KEY", ""),
  /** Bucket name (e.g. "sk-furniture-media"). */
  r2Bucket: str("R2_BUCKET", ""),
  /** Optional full S3 endpoint override — defaults to https://<account>.r2.cloudflarestorage.com.
   *  Point it at any S3-compatible endpoint (MinIO, AWS S3, Backblaze B3) if not using R2. */
  r2Endpoint: str("R2_ENDPOINT", "").replace(/\/$/, ""),

  /**
   * Public base under which storage keys are served (client-safe, NEXT_PUBLIC).
   * Local driver → "/api/media"; R2 production → e.g. "https://images.shop.in".
   */
  storagePublicBase: str("NEXT_PUBLIC_STORAGE_PUBLIC_BASE", "/api/media").replace(/\/$/, ""),

  /** Admin bootstrap credentials — used ONLY by the seed script, never at runtime. */
  seedAdminUsername: str("SEED_ADMIN_USERNAME", "admin"),
  seedAdminPassword: str("SEED_ADMIN_PASSWORD", "Admin@123"),
} as const;

export type AppEnv = typeof env;

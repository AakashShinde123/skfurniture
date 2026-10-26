import { MEDIA_TYPES, MEDIA_MAX_BYTES } from "@/lib/constants";
import { env } from "@/lib/env";

/**
 * Media helpers shared by the upload API, services and UI components.
 * Filenames are never trusted for paths — stored keys are always generated
 * server-side, and only the extension is derived from the MIME type.
 */

export function validateMediaType(mimeType: string): void {
  if (!MEDIA_TYPES.allowed.includes(mimeType)) {
    throw new Error(`Unsupported image type "${mimeType}". Allowed: JPG, PNG, WebP.`);
  }
}

export function validateMediaSize(bytes: number): void {
  if (bytes > MEDIA_MAX_BYTES) {
    throw new Error(
      `Image is too large (${(bytes / 1024 / 1024).toFixed(1)} MB). Maximum is ${
        MEDIA_MAX_BYTES / 1024 / 1024
      } MB.`,
    );
  }
}

/** Derive a safe extension from a MIME type (never from user input). */
export function extensionForMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[mimeType] ?? "bin";
}

/** Slugify a filename for readable storage keys. */
export function slugifyFilename(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "image";
}

/**
 * Convert a stored storage key to a browser-safe URL.
 *
 * Works on both server and client: it relies only on the NEXT_PUBLIC storage
 * base ("/api/media" locally, the R2 public domain in production). Values
 * that are already URLs/paths pass through untouched, which keeps the CMS
 * tolerant of manually pasted image links.
 */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("/")) {
    return key;
  }
  return `${env.storagePublicBase}/${key}`;
}

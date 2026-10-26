import sharp from "sharp";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { MEDIA_MAX_BYTES, MEDIA_TYPES, type UploadFolder } from "@/lib/constants";
import { extensionForMime, slugifyFilename, validateMediaSize, validateMediaType } from "@/lib/media";
import { storage } from "@/lib/storage";
import { NotFoundError, ValidationError } from "@/lib/errors";

/**
 * Media service — upload validation, sharp-based optimisation and reference
 * safety for deletions.
 *
 * Pipeline: validate type/size → EXIF-rotate → cap longest edge → WebP
 * optimise → store via the storage driver → record MediaAsset. Product
 * galleries reference the storage key (`imageKey`), which becomes the R2
 * object key in production.
 */

export interface MediaAssetDto {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  url: string;
  createdAt: string;
}

function toDto(row: {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: Date;
}): MediaAssetDto {
  return {
    ...row,
    url: storage().publicUrl(row.key),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function uploadImage(file: File, folder: UploadFolder = "products"): Promise<MediaAssetDto> {
  validateMediaType(file.type);
  validateMediaSize(file.size);

  const source = Buffer.from(await file.arrayBuffer());

  const optimised = await sharp(source)
    .rotate() // honour EXIF orientation
    .resize({
      width: MEDIA_TYPES.maxDimensionPx,
      height: MEDIA_TYPES.maxDimensionPx,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: MEDIA_TYPES.webpQuality })
    .toBuffer({ resolveWithObject: true });

  const key = `${folder}/${Date.now()}-${slugifyFilename(file.name)}.webp`;
  await storage().put(key, optimised.data, "image/webp");

  const created = await db.mediaAsset.create({
    data: {
      key,
      filename: file.name.slice(0, 200),
      mimeType: "image/webp",
      size: optimised.data.length,
      width: optimised.info.width,
      height: optimised.info.height,
    },
  });

  return toDto(created);
}

export async function listMedia(): Promise<MediaAssetDto[]> {
  const rows = await db.mediaAsset.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toDto);
}

export async function updateAltText(key: string, altText: string | null): Promise<MediaAssetDto> {
  const row = await db.mediaAsset.findUnique({ where: { key } });
  if (!row) throw new NotFoundError("Media asset not found.");
  const updated = await db.mediaAsset.update({ where: { key }, data: { altText } });
  return toDto(updated);
}

/** Collect every storage key currently referenced by real content. */
async function referencedKeys(): Promise<Set<string>> {
  const [productImages, categories, settings] = await Promise.all([
    db.productImage.findMany({ select: { imageKey: true } }),
    db.category.findMany({ select: { imageUrl: true } }),
    db.siteSetting.findMany({ select: { heroImageUrl: true, logoUrl: true, showroomImages: true } }),
  ]);

  const keys = new Set<string>();
  productImages.forEach((image) => keys.add(image.imageKey));
  categories.forEach((category) => category.imageUrl && keys.add(category.imageUrl));

  for (const setting of settings) {
    if (setting.heroImageUrl) keys.add(setting.heroImageUrl);
    if (setting.logoUrl) keys.add(setting.logoUrl);
    try {
      const showroom = setting.showroomImages ? (JSON.parse(setting.showroomImages) as unknown) : [];
      if (Array.isArray(showroom)) showroom.forEach((key) => typeof key === "string" && keys.add(key));
    } catch {
      // ignore malformed JSON
    }
  }

  return keys;
}

/** Delete a media asset unless it is still referenced by published content. */
export async function deleteMedia(key: string): Promise<void> {
  const row = await db.mediaAsset.findUnique({ where: { key } });
  if (!row) throw new NotFoundError("Media asset not found.");

  const referenced = await referencedKeys();
  if (referenced.has(key)) {
    throw new ValidationError(
      "This image is still used by a product, category or site setting. Remove it there first.",
    );
  }

  await db.mediaAsset.delete({ where: { key } });
  await storage().delete(key);
}

/**
 * Garbage-collect storage objects that are no longer referenced by any row.
 * Called after product deletion; also safe to run on a schedule.
 */
export async function reapOrphanKeys(): Promise<number> {
  const [assets, referenced] = await Promise.all([db.mediaAsset.findMany({ select: { key: true } }), referencedKeys()]);
  const orphaned = assets.filter((asset) => !referenced.has(asset.key));

  for (const asset of orphaned) {
    await db.mediaAsset.delete({ where: { key: asset.key } });
    await storage().delete(asset.key);
  }
  return orphaned.length;
}

export const mediaServiceConfig = {
  maxBytes: MEDIA_MAX_BYTES,
  allowedTypes: MEDIA_TYPES.allowed,
  uploadsDir: env.uploadsDir,
};

import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { UPLOAD_FOLDERS, type UploadFolder } from "@/lib/constants";
import { ValidationError } from "@/lib/errors";
import { uploadImage } from "@/services/media.service";

/** Multipart handler: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

/**
 * POST /api/upload — multipart image upload (admin only).
 *
 * Validation happens in media.service: MIME allow-list, size ceiling, sharp
 * EXIF-rotation + downscale + WebP optimisation. The storage key is generated
 * server-side; user-supplied paths are never trusted.
 */
export const POST = withAdmin(async ({ req }) => {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    throw new ValidationError("Expected a multipart form-data request.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ValidationError("Attach an image file under the 'file' field.");
  }

  const folderRaw = formData.get("folder");
  const folder =
    typeof folderRaw === "string" && (UPLOAD_FOLDERS as readonly string[]).includes(folderRaw)
      ? (folderRaw as UploadFolder)
      : "products";

  const asset = await uploadImage(file, folder);
  return NextResponse.json({ data: asset }, { status: 201 });
});

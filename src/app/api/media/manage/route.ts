import { NextResponse } from "next/server";
import { withAdmin, parseJson } from "@/lib/api-handler";
import { z } from "zod";
import { deleteMedia, updateAltText } from "@/services/media.service";

const bodySchema = z.object({
  action: z.enum(["delete", "setAlt"]),
  key: z.string().trim().min(1).max(500),
  altText: z.string().trim().max(300).nullable().optional(),
});

/**
 * POST /api/media/manage — mutating media operations (admin only).
 * A single POST endpoint keeps the catch-all file route free for public GETs.
 */
export const POST = withAdmin(async ({ req }) => {
  const body = await parseJson(req, bodySchema);

  if (body.action === "delete") {
    await deleteMedia(body.key);
    return NextResponse.json({ data: { ok: true } });
  }

  const asset = await updateAltText(body.key, body.altText ?? null);
  return NextResponse.json({ data: asset });
});

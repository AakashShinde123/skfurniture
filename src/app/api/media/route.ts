import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { listMedia } from "@/services/media.service";

/** DB-backed route: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

/** GET /api/media — media library listing (admin only). */
export const GET = withAdmin(async () => {
  const assets = await listMedia();
  return NextResponse.json({ data: assets });
});

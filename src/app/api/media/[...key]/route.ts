import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

/** File serving: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

type Params = { key: string[] };

/**
 * GET /api/media/<key> — public file serving for the local storage driver.
 * Mirrors how an R2 public URL behaves (plain HTTP fetch), so templates do
 * not change when the storage driver swaps in production.
 */
export async function GET(_req: Request, ctx: { params: Promise<Params> }): Promise<Response> {
  const { key: segments } = await ctx.params;
  const key = segments.join("/");

  const data = await storage().get(key);
  if (!data) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Image not found." } },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

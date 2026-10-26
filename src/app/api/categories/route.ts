import { NextResponse } from "next/server";
import { withAdmin, withApi, parseJson } from "@/lib/api-handler";
import { categoryCreateSchema } from "@/validations/schemas";
import * as categoryService from "@/services/category.service";

/** DB-backed route: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

/**
 * /api/categories
 * GET  — public list (active only). The admin list adds ?includeInactive=1
 *        and is served from the same handler; inactive categories carry no
 *        sensitive data.
 * POST — create (admin only).
 */

export const GET = withApi(async ({ req }) => {
  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "1";
  const categories = await categoryService.listCategories({
    includeInactive,
    withCounts: includeInactive,
  });
  return NextResponse.json({ data: categories });
});

export const POST = withAdmin(async ({ req }) => {
  const body = await parseJson(req, categoryCreateSchema);
  const category = await categoryService.createCategory(body);
  return NextResponse.json({ data: category }, { status: 201 });
});

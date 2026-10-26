import { NextResponse } from "next/server";
import { withAdmin, withApi, parseJson } from "@/lib/api-handler";
import { categoryUpdateSchema } from "@/validations/schemas";
import * as categoryService from "@/services/category.service";

/** DB-backed route: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

type Params = { id: string };

export const GET = withApi<Params>(async ({ params }) => {
  const category = await categoryService.getCategoryById(params.id);
  return NextResponse.json({ data: category });
});

export const PUT = withAdmin<Params>(async ({ req, params }) => {
  const body = await parseJson(req, categoryUpdateSchema);
  const category = await categoryService.updateCategory(params.id, body);
  return NextResponse.json({ data: category });
});

export const DELETE = withAdmin<Params>(async ({ params }) => {
  await categoryService.deleteCategory(params.id);
  return NextResponse.json({ data: { ok: true } });
});

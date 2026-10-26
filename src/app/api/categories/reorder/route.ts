import { NextResponse } from "next/server";
import { withAdmin, parseJson } from "@/lib/api-handler";
import { categoryReorderSchema } from "@/validations/schemas";
import * as categoryService from "@/services/category.service";

/** POST /api/categories/reorder — persist the new category order. */
export const POST = withAdmin(async ({ req }) => {
  const body = await parseJson(req, categoryReorderSchema);
  const categories = await categoryService.reorderCategories(body.orderedIds);
  return NextResponse.json({ data: categories });
});

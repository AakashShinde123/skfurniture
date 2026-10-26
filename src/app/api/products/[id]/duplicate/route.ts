import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import * as productService from "@/services/product.service";

type Params = { id: string };

/** POST /api/products/:id/duplicate — clone into a new draft. */
export const POST = withAdmin<Params>(async ({ params }) => {
  const product = await productService.duplicateProduct(params.id);
  return NextResponse.json({ data: product }, { status: 201 });
});

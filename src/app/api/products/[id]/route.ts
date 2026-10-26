import { NextResponse } from "next/server";
import { withAdmin, withApi, parseJson } from "@/lib/api-handler";
import { productUpdateSchema } from "@/validations/schemas";
import * as productService from "@/services/product.service";
import { reapOrphanKeys } from "@/services/media.service";

/** DB-backed route: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

type Params = { id: string };

export const GET = withAdmin<Params>(async ({ params }) => {
  const product = await productService.getProductById(params.id);
  return NextResponse.json({ data: product });
});

export const PUT = withAdmin<Params>(async ({ req, params }) => {
  const body = await parseJson(req, productUpdateSchema);
  const product = await productService.updateProduct(params.id, body);
  return NextResponse.json({ data: product });
});

export const DELETE = withAdmin<Params>(async ({ params }) => {
  await productService.deleteProduct(params.id);
  // Clean up storage objects that nothing references anymore.
  await reapOrphanKeys();
  return NextResponse.json({ data: { ok: true } });
});

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, parseJson } from "@/lib/api-handler";
import * as productService from "@/services/product.service";

type Params = { id: string };

const statusBody = z.object({ status: z.enum(["DRAFT", "PUBLISHED"]) });

/** PATCH /api/products/:id/status — publish or unpublish. */
export const PATCH = withAdmin<Params>(async ({ req, params }) => {
  const body = await parseJson(req, statusBody);
  const product = await productService.setProductStatus(params.id, body.status);
  return NextResponse.json({ data: product });
});

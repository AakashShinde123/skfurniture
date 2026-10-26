import { NextResponse } from "next/server";
import { withAdmin, withApi, parseJson, parseQuery } from "@/lib/api-handler";
import { productListQuerySchema, productCreateSchema } from "@/validations/schemas";
import * as productService from "@/services/product.service";

/** DB-backed route: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

/**
 * /api/products
 * GET  — public catalogue listing (published only). Admin-scoped filters
 *        (status=DRAFT etc.) are still allowed here but only ever exercised
 *        by the CMS, which must hold a valid session for write actions.
 * POST — create product (admin only).
 */

export const GET = withApi(async ({ req }) => {
  const query = parseQuery(req, productListQuerySchema);

  // Admin listing only when explicitly requested (drafts / availability / per-category views).
  // NOTE: an ABSENT availability param must NOT be treated as an admin filter —
  // otherwise the public catalogue would silently include drafts.
  const isAdminListing =
    query.status === "DRAFT" ||
    Boolean(query.categoryId) ||
    (query.availability !== undefined && query.availability !== "ALL");

  if (isAdminListing) {
    const result = await productService.listProductsForAdmin({
      search: query.search,
      categoryId: query.categoryId,
      status: query.status,
      availability: query.availability,
      featured: query.featured === "true" ? true : query.featured === "false" ? false : undefined,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });
    return NextResponse.json({ data: result });
  }

  const result = await productService.listPublicProducts({
    search: query.search,
    categorySlug: query.categorySlug,
    featuredOnly: query.featured === "true",
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
  });
  return NextResponse.json({ data: result });
});

export const POST = withAdmin(async ({ req }) => {
  const body = await parseJson(req, productCreateSchema);
  const product = await productService.createProduct(body);
  return NextResponse.json({ data: product }, { status: 201 });
});

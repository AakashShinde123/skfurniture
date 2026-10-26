import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "./api-response";
import { AdminSessionUser, requireAdmin } from "./auth/guard";

/**
 * Route handler utilities.
 *
 * `withApi` wraps handlers with centralised error mapping.
 * `withAdmin` additionally resolves + validates the admin session before the
 * handler runs — authorization is never the UI's responsibility.
 */

type ApiContext<P = Record<string, string>> = {
  req: NextRequest;
  params: P;
};

type RouteHandler<P = Record<string, string>> = (
  ctx: ApiContext<P>,
) => Promise<NextResponse> | NextResponse;

type AdminRouteHandler<P = Record<string, string>> = (
  ctx: ApiContext<P> & { admin: AdminSessionUser },
) => Promise<NextResponse> | NextResponse;

export function withApi<P = Record<string, string>>(
  handler: RouteHandler<P>,
): (req: NextRequest, ctx: { params: Promise<P> }) => Promise<NextResponse> {
  return async (req, routeCtx) => {
    try {
      const params = routeCtx?.params ? await routeCtx.params : ({} as P);
      return await handler({ req, params });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function withAdmin<P = Record<string, string>>(
  handler: AdminRouteHandler<P>,
): (req: NextRequest, ctx: { params: Promise<P> }) => Promise<NextResponse> {
  return async (req, routeCtx) => {
    try {
      const params = routeCtx?.params ? await routeCtx.params : ({} as P);
      const admin = await requireAdmin();
      return await handler({ req, params, admin });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Parse and validate a JSON request body with a Zod schema. */
export async function parseJson<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  return schema.parse(raw);
}

/** Parse and validate URL search params with a Zod schema. */
export function parseQuery<S extends z.ZodTypeAny>(req: NextRequest, schema: S): z.infer<S> {
  const entries = Object.fromEntries(req.nextUrl.searchParams.entries());
  return schema.parse(entries);
}

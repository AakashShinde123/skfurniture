import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-handler";
import { getSessionUser } from "@/lib/auth/session";
import type { SessionDto } from "@/types";

/** Session route: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const user = await getSessionUser();
  const payload: SessionDto = user
    ? { authenticated: true, user: { username: user.username, name: user.name } }
    : { authenticated: false, user: null };
  return NextResponse.json({ data: payload });
});

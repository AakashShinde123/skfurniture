import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-handler";
import { logout } from "@/services/auth.service";

export const POST = withApi(async () => {
  await logout();
  return NextResponse.json({ data: { ok: true } });
});

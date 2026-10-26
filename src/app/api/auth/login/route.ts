import { NextResponse } from "next/server";
import { withApi, parseJson } from "@/lib/api-handler";
import { loginSchema } from "@/validations/schemas";
import { login } from "@/services/auth.service";

export const POST = withApi(async ({ req }) => {
  const body = await parseJson(req, loginSchema);
  const user = await login({
    username: body.username,
    password: body.password,
    userAgent: req.headers.get("user-agent"),
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });
  return NextResponse.json({ data: user });
});

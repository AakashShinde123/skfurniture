import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { getDashboardStats } from "@/services/dashboard.service";

/** DB-backed route: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

/** GET /api/dashboard — CMS overview counters (admin only). */
export const GET = withAdmin(async () => {
  const stats = await getDashboardStats();
  return NextResponse.json({ data: stats });
});

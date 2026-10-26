import { NextResponse } from "next/server";
import { withAdmin, withApi, parseJson } from "@/lib/api-handler";
import { settingsUpdateSchema } from "@/validations/schemas";
import { getSettings, updateSettings } from "@/services/settings.service";

/** DB-backed route: always per-request, never prerendered at build time. */
export const dynamic = "force-dynamic";

/**
 * /api/settings
 * GET — public-safe subset is derived on the client; full settings are not
 *      sensitive (contact info and marketing content by nature).
 * PUT — admin only.
 */

export const GET = withApi(async () => {
  const settings = await getSettings();
  return NextResponse.json({ data: settings });
});

export const PUT = withAdmin(async ({ req }) => {
  const body = await parseJson(req, settingsUpdateSchema);
  const settings = await updateSettings(body);
  return NextResponse.json({ data: settings });
});

import { checkDbHealth, describeDbUrl, type DbHealth } from "@/lib/db-health";

/**
 * Deployment diagnostic — GET /api/health
 *
 * Open https://<your-site>/api/health after deploying to see exactly why the
 * site misbehaves:
 *   "up"             → database reachable and schema present; the app is healthy
 *   "down"           → DATABASE_URL missing/wrong, or the database refuses
 *                      connections from Netlify (SSL / IP allowlist / paused DB)
 *   "missing-tables" → connected, but the schema was never deployed to this
 *                      database — run `npm run db:push` + `npm run seed`
 *                      with DATABASE_URL pointing at it
 *
 * `connection` shows whether DATABASE_URL exists at runtime and the masked
 * host it points to (never credentials) — this distinguishes a missing env
 * variable from an unreachable server.
 */
export const dynamic = "force-dynamic";

function hintFor(status: DbHealth["database"]): string {
  switch (status) {
    case "up":
      return "Database reachable and schema present.";
    case "missing-tables":
      return "Connected to the database but the tables are missing. Run once from your machine: `npm run db:push` then `npm run seed` with DATABASE_URL in .env pointing at this database.";
    case "down":
      return "Cannot reach the database. Check the DATABASE_URL environment variable in Netlify (scopes must include Functions), verify the database server is running/allowed (SSL mode, IP allowlist), and that the connection string matches your provider.";
  }
}

export async function GET(): Promise<Response> {
  const health = await checkDbHealth();
  const connection = describeDbUrl();
  const ok = health.database === "up";

  return Response.json(
    {
      status: ok ? "ok" : "degraded",
      app: "sk-furniture",
      time: new Date().toISOString(),
      connection,
      database: {
        status: health.database,
        detail: health.detail ?? null,
      },
      hint: hintFor(health.database),
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}

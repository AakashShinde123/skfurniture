import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Database availability helpers.
 *
 * Public pages must never hard-crash because the database is unreachable or
 * has not been migrated yet — a brand-new production database (e.g. a fresh
 * Neon/Supabase project that has not received `prisma db push` + seed yet)
 * would otherwise take the whole site down with a generic error page.
 *
 * These helpers classify Prisma failures so services can fall back to safe
 * defaults, and power the GET /api/health diagnostic endpoint.
 */

/** Prisma known-request codes that mean "schema not deployed to this database". */
const SCHEMA_MISSING_CODES = new Set([
  "P2021", // the table does not exist in the current database
  "P2022", // the column does not exist in the current database
]);

/** True when the failure means "cannot talk to this database / schema absent". */
export function isDbUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    SCHEMA_MISSING_CODES.has(error.code)
  ) {
    return true;
  }
  return false;
}

/** Best-effort strip of anything credential-shaped from an error message. */
function sanitize(message: string): string {
  return message.replace(/:\/\/[^:/\s]+:[^@/\s]+@/g, "://***:***@");
}

/**
 * Prisma wraps failures like:
 *   "\nInvalid `prisma.$queryRaw()` invocation:\n\n\nCan't reach database server at `host:5432`\n\nPlease make sure…"
 * The useful cause sits after the "Invalid … invocation:" wrapper line.
 */
function extractCause(message: string): string {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const causes = lines.filter((line) => !/^Invalid `prisma\.[^`]+` invocation:$/.test(line));
  const joined = causes.slice(0, 2).join(" — ");
  return joined || lines[0] || "";
}

/** Compact, log-friendly description of a Prisma error (never throws). */
export function describeDbError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `${error.code}: ${sanitize(extractCause(error.message) || "unknown request error")}`;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const message = sanitize(extractCause(error.message) || "initialization failed (no message)");
    return error.errorCode ? `Error code ${error.errorCode}: ${message}` : message;
  }
  if (error instanceof Error) {
    const message = sanitize(extractCause(error.message));
    return message ? `${error.name}: ${message}` : error.name;
  }
  return "Unknown database error";
}

export interface DbUrlInfo {
  /** True when DATABASE_URL is present in the runtime environment. */
  configured: boolean;
  /** Masked "scheme://host:port" — never contains credentials. */
  target: string | null;
  /** Short human note for common misconfigurations. */
  note?: string;
}

/**
 * Inspect DATABASE_URL without leaking credentials — the health endpoint
 * uses this to distinguish "env var missing" from "host unreachable".
 */
export function describeDbUrl(): DbUrlInfo {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { configured: false, target: null };
  try {
    const url = new URL(raw);
    const target = `${url.protocol}//${url.host}${url.pathname === "/" ? "" : url.pathname}`;
    if (url.protocol === "file:") {
      return { configured: true, target, note: "This is a SQLite path, not a PostgreSQL server." };
    }
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      return { configured: true, target, note: "Unexpected scheme — expected postgresql://" };
    }
    return { configured: true, target };
  } catch {
    return {
      configured: true,
      target: null,
      note: "DATABASE_URL is set but is not a valid connection string.",
    };
  }
}

export type DbHealthStatus = "up" | "down" | "missing-tables";

export interface DbHealth {
  database: DbHealthStatus;
  /** Sanitized error detail — present only when not "up". */
  detail?: string;
}

/**
 * Probe the database in two steps:
 *  1. `SELECT 1`          → is the server reachable and does DATABASE_URL work?
 *  2. count on SiteSetting → does the deployed schema contain our tables?
 */
export async function checkDbHealth(): Promise<DbHealth> {
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    return { database: "down", detail: describeDbError(error) };
  }

  try {
    await db.siteSetting.count();
    return { database: "up" };
  } catch (error) {
    return { database: "missing-tables", detail: describeDbError(error) };
  }
}


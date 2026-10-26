import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Server-side session management.
 *
 * - Raw token (32 random bytes, base64url) lives ONLY in an HTTP-only cookie.
 * - The database stores a SHA-256 hash of the token — a database leak never
 *   exposes usable sessions.
 * - Sessions expire after `SESSION_TTL_HOURS` and are validated on every
 *   server-side request. Nothing about authorization is decided in the browser.
 */

export const SESSION_COOKIE = "fch_admin_session";
const SESSION_TTL_HOURS = 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  username: string;
  name: string;
}

interface CreateSessionInput {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(input: CreateSessionInput): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await db.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId: input.userId,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.siteUrl.startsWith("https://"),
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/** Resolve the current admin from the session cookie. Returns null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (!session.user.isActive) return null;

  // Touch activity so idle-expiry policies can be layered on later.
  await db.adminSession
    .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
    .catch(() => undefined);

  return {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
  };
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.adminSession
      .delete({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Housekeeping: delete expired sessions (call from cron or login flow). */
export async function pruneExpiredSessions(): Promise<void> {
  await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

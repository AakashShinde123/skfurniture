import { db } from "@/lib/db";
import { UnauthorizedError, RateLimitedError, ForbiddenError } from "@/lib/errors";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroyCurrentSession, pruneExpiredSessions } from "@/lib/auth/session";

/**
 * Authentication service — credential verification, login throttling and
 * session lifecycle. No public registration exists by design (PRD §8); the
 * single admin account is provisioned by the seed script.
 */

const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS_PER_WINDOW = 8;

interface AttemptBucket {
  count: number;
  resetAt: number;
}

/** In-memory throttle. For multi-instance deployments move this to PostgreSQL or a KV store. */
const attempts = new Map<string, AttemptBucket>();

function consumeAttempt(key: string): void {
  const now = Date.now();
  const bucket = attempts.get(key);

  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  bucket.count += 1;
  if (bucket.count > MAX_ATTEMPTS_PER_WINDOW) {
    const waitMinutes = Math.ceil((bucket.resetAt - now) / 60000);
    throw new RateLimitedError(
      `Too many failed attempts. Try again in about ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
    );
  }
}

function clearAttempts(key: string): void {
  attempts.delete(key);
}

export async function login(input: {
  username: string;
  password: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<{ username: string; name: string }> {
  const throttleKey = `${input.ipAddress ?? "unknown"}:${input.username.toLowerCase()}`;
  consumeAttempt(throttleKey);

  const user = await db.adminUser.findUnique({ where: { username: input.username.trim() } });
  if (!user || !user.isActive) {
    throw new UnauthorizedError("Invalid username or password.");
  }

  const passwordOk = await verifyPassword(input.password, user.passwordHash);
  if (!passwordOk) {
    throw new UnauthorizedError("Invalid username or password.");
  }

  clearAttempts(throttleKey);
  await pruneExpiredSessions();
  await createSession({
    userId: user.id,
    userAgent: input.userAgent ?? null,
    ipAddress: input.ipAddress ?? null,
  });

  return { username: user.username, name: user.name };
}

export async function logout(): Promise<void> {
  await destroyCurrentSession();
}

/** Used by server components to assert an authenticated context. */
export async function requireSession() {
  const { getSessionUser } = await import("@/lib/auth/session");
  const user = await getSessionUser();
  if (!user) throw new ForbiddenError();
  return user;
}

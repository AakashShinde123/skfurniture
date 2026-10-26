import bcrypt from "bcryptjs";

/**
 * Password hashing utilities.
 *
 * bcryptjs is pure JavaScript, so the same hashing works on Node.js during
 * development and on the Cloudflare Workers runtime in production.
 */

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

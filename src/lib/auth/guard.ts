import { UnauthorizedError } from "@/lib/errors";
import { getSessionUser, SessionUser } from "./session";

export type AdminSessionUser = SessionUser;

/**
 * API authorization guard — every write endpoint funnels through here, so
 * permissions are always validated server-side, never in the browser.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

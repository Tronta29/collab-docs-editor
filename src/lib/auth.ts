import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "uid";

export type CurrentUser = { id: string; email: string; name: string };

/**
 * The only place the current user is determined.
 *
 * MOCK AUTH, KNOWN LIMITATION: the `uid` cookie is just the user id, unsigned, so anyone
 * can impersonate another user by editing the cookie. Fine for a demo; a real app would
 * use a signed/encrypted session (or an auth provider). The id is still re-checked
 * against the DB on every call and is never read from a request body or query string.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

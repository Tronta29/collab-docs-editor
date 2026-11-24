import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "uid";

export type CurrentUser = { id: string; email: string; name: string };

/**
 * The only place the current user is determined. Mocked auth: the cookie holds the
 * user id (unsigned). Always re-checked against the DB, never taken from client input.
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

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { signInSchema } from "@/lib/schemas";

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) redirect("/signin?error=invalid");

  const user = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!user) redirect("/signin?error=invalid");

  (await cookies()).set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/signin");
}

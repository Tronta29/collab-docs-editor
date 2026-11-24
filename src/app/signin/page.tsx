import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/actions";

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  if (await getCurrentUser()) redirect("/");

  const { error } = await searchParams;
  const users = await db.user.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="text-2xl font-semibold">Sign in as…</h1>
      <p className="mt-1 text-sm text-gray-600">Demo only: pick an account, no password needed.</p>
      {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">That user doesn&apos;t exist. Pick one below.</p>}
      <ul className="mt-6 space-y-2">
        {users.map((u) => (
          <li key={u.id}>
            <form action={signIn}>
              <input type="hidden" name="userId" value={u.id} />
              <button
                type="submit"
                className="w-full rounded border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-100"
              >
                <span className="font-medium">{u.name}</span>
                <span className="ml-2 text-sm text-gray-500">{u.email}</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

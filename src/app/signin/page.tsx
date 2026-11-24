import { ChevronRight, Info } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/Header";
import { Avatar } from "@/components/ui/Avatar";
import { signIn } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  if (await getCurrentUser()) redirect("/");

  const { error } = await searchParams;
  const users = await db.user.findMany({ orderBy: { name: "asc" } });

  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandMark />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">Sign in as…</h1>
          <p className="mt-1 text-sm text-zinc-600">Pick one of the demo accounts to try the app.</p>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              That account doesn&apos;t exist. Pick one below.
            </p>
          )}

          <ul className="mt-5 space-y-2">
            {users.map((u) => (
              <li key={u.id}>
                <form action={signIn}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button
                    type="submit"
                    className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:border-accent/50 hover:bg-accent-soft/40"
                  >
                    <Avatar name={u.name} size="lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{u.name}</span>
                      <span className="block truncate text-sm text-zinc-600">{u.email}</span>
                    </span>
                    <ChevronRight size={18} aria-hidden className="text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 px-2 text-center text-xs leading-relaxed text-zinc-600">
          <Info size={14} aria-hidden className="mr-1.5 inline-block align-[-2px]" />
          Demo authentication: there are no passwords and nothing here is secured. A real app would use proper sign-in.
        </p>
      </div>
    </main>
  );
}

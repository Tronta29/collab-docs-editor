import Link from "next/link";
import { signOut } from "@/lib/actions";
import type { CurrentUser } from "@/lib/auth";

export function Header({ user }: { user: CurrentUser }) {
  return (
    <header className="border-b border-gray-200 bg-white text-gray-900">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Docs
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {user.name} <span className="text-gray-600">({user.email})</span>
          </span>
          <form action={signOut}>
            <button type="submit" className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-800 hover:bg-gray-100">
              Switch user
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

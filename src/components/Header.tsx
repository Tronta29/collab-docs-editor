import { FileText } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import type { CurrentUser } from "@/lib/auth";

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight text-zinc-900">
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-white shadow-sm">
        <FileText size={18} aria-hidden />
      </span>
      Docs
    </span>
  );
}

export function Header({ user }: { user: CurrentUser }) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="Docs, all documents" className="rounded-lg">
          <BrandMark />
        </Link>
        <UserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

// Also what strangers see for documents they can't access: same page as a missing one.
export default function NotFound() {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-zinc-100 text-zinc-600">
          <FileQuestion size={24} aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Document not found</h1>
        <p className="mt-2 text-sm text-zinc-600">
          It may have been deleted, or you may not have access to it. If someone shared it with you, ask them to share it again.
        </p>
        <Link href="/" className={`${buttonClass("primary")} mt-6`}>
          Back to documents
        </Link>
      </div>
    </main>
  );
}

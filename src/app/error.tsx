"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClass } from "@/components/ui/Button";

// Catches anything thrown while rendering a page (e.g. the database being unreachable).
// In production Next.js strips the real message from server errors, so no stack trace or
// connection details reach the browser; `digest` ties this screen to the server log.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof globalThis.Error ? (error as { digest?: string }).digest : undefined;

  return (
    <main id="main" className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
          <TriangleAlert size={24} aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-600">
          We couldn&apos;t load this page. This is usually temporary, for example the database waking up. Your documents are safe.
        </p>
        {digest && <p className="mt-2 text-xs text-zinc-500">Reference: {digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="primary" onClick={() => retry()}>
            <RefreshCw size={15} aria-hidden /> Try again
          </Button>
          <Link href="/" className={buttonClass("secondary")}>
            Back to documents
          </Link>
        </div>
      </div>
    </main>
  );
}

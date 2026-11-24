"use client";

import Link from "next/link";
import { useEffect } from "react";

// Catches anything thrown while rendering a page (e.g. the database being unreachable).
// In production Next.js strips the real message from server errors, so no stack trace or
// connection details reach the browser; `digest` ties this screen to the server log.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof globalThis.Error ? (error as { digest?: string }).digest : undefined;

  return (
    <main className="mx-auto mt-24 max-w-md px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-gray-600">
        We couldn&apos;t load this page. This is usually temporary, for example the database waking up. Your documents are safe.
      </p>
      {digest && <p className="mt-2 text-xs text-gray-500">Reference: {digest}</p>}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <Link href="/" className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
          Back to documents
        </Link>
      </div>
    </main>
  );
}

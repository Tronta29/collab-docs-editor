import Link from "next/link";

// Also what strangers see for documents they can't access: same page as a missing one.
export default function NotFound() {
  return (
    <main className="mx-auto mt-24 max-w-md px-4 text-center">
      <h1 className="text-2xl font-semibold">Document not found</h1>
      <p className="mt-2 text-gray-600">
        It may have been deleted, or you may not have access to it. If someone shared it with you, ask them to share it again.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to documents
      </Link>
    </main>
  );
}

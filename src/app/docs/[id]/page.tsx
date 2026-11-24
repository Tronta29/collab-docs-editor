import type { JSONContent } from "@tiptap/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Editor } from "@/components/Editor";
import { Header } from "@/components/Header";
import { TitleForm } from "@/components/TitleForm";
import { requireUser } from "@/lib/auth";
import { getDocumentWithContent } from "@/lib/documents";
import { canRename } from "@/lib/permissions";

export default async function DocumentPage({ params }: PageProps<"/docs/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  // null for both "doesn't exist" and "not yours": strangers can't tell the difference.
  const doc = await getDocumentWithContent(user, id);
  if (!doc) notFound();

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← All documents
        </Link>
        <div className="my-4">
          {canRename(user, doc) ? (
            <TitleForm id={doc.id} title={doc.title} />
          ) : (
            <>
              <h1 className="px-2 py-1 text-2xl font-semibold">{doc.title}</h1>
              <p className="px-2 text-sm text-gray-500">Shared by {doc.ownerName}. You can edit, but only they can rename it.</p>
            </>
          )}
        </div>
        <Editor docId={doc.id} initialContent={doc.content as JSONContent} />
      </main>
    </>
  );
}

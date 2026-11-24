import type { JSONContent } from "@tiptap/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Editor } from "@/components/Editor";
import { Header } from "@/components/Header";
import { ShareDialog } from "@/components/ShareDialog";
import { TitleForm } from "@/components/TitleForm";
import { requireUser } from "@/lib/auth";
import { getDocumentWithContent } from "@/lib/documents";
import { canEdit, canRename, canShare } from "@/lib/permissions";

export default async function DocumentPage({ params }: PageProps<"/docs/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  // null for both "doesn't exist" and "not yours": strangers can't tell the difference.
  const doc = await getDocumentWithContent(user, id);
  if (!doc) notFound();

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:p-0">
        <Link href="/" className="text-sm text-blue-600 hover:underline print:hidden">
          ← All documents
        </Link>
        {/* Printing shows only this plain title and the content (the editable title form is hidden). */}
        <h1 className="mb-4 hidden text-3xl font-bold print:block">{doc.title}</h1>
        <div className="my-4 flex items-start justify-between gap-4 print:hidden">
          <div className="min-w-0 flex-1">
            {canRename(user, doc) ? (
              <TitleForm id={doc.id} title={doc.title} />
            ) : (
              <>
                <h1 className="px-2 py-1 text-2xl font-semibold">{doc.title}</h1>
                <p className="px-2 text-sm text-gray-500">
                  Shared by {doc.ownerName}.{" "}
                  {canEdit(user, doc) ? "You can edit, but only they can rename it." : "You have view-only access."}
                </p>
              </>
            )}
          </div>
          {canShare(user, doc) && (
            <ShareDialog documentId={doc.id} ownerName={doc.ownerName} collaborators={doc.collaborators} />
          )}
        </div>
        <Editor docId={doc.id} initialContent={doc.content as JSONContent} readOnly={!canEdit(user, doc)} />
      </main>
    </>
  );
}

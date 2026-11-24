import type { JSONContent } from "@tiptap/react";
import { ArrowLeft } from "lucide-react";
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

  const editable = canEdit(user, doc);

  return (
    // The "desk" the white page sits on; plain white when printing.
    <div className="min-h-screen bg-desk print:bg-white">
      <Header user={user} />
      <main id="main">
        <div className="mx-auto max-w-[816px] px-4 pb-4 pt-5 print:max-w-none print:p-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 print:hidden"
          >
            <ArrowLeft size={15} aria-hidden /> All documents
          </Link>

          {/* Printing shows only this plain title and the content (the editable title form is hidden). */}
          <h1 className="mb-4 hidden text-3xl font-bold print:block">{doc.title}</h1>

          <div className="mt-3 flex items-start justify-between gap-4 print:hidden">
            <div className="min-w-0 flex-1">
              {canRename(user, doc) ? (
                <TitleForm id={doc.id} title={doc.title} />
              ) : (
                <>
                  <h1 className="truncate text-3xl font-semibold tracking-tight">{doc.title}</h1>
                  <p className="mt-2 text-sm text-zinc-600">
                    Shared by {doc.ownerName} · {editable ? "You can edit, but only they can rename it." : "You have view-only access."}
                  </p>
                </>
              )}
            </div>
            {canShare(user, doc) && (
              <ShareDialog documentId={doc.id} ownerName={doc.ownerName} collaborators={doc.collaborators} />
            )}
          </div>
        </div>
        <Editor docId={doc.id} initialContent={doc.content as JSONContent} readOnly={!editable} />
      </main>
    </div>
  );
}

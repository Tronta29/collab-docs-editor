import { CreateDocumentForm } from "@/components/CreateDocumentForm";
import { DocumentLists } from "@/components/DocumentLists";
import { Header } from "@/components/Header";
import { ImportForm } from "@/components/ImportForm";
import { requireUser } from "@/lib/auth";
import { listDocumentsForUser } from "@/lib/documents";
import { MAX_IMPORT_BYTES, SUPPORTED_EXTENSIONS } from "@/lib/import/limits";

export default async function Home() {
  const user = await requireUser();
  const { mine, shared } = await listDocumentsForUser(user);

  return (
    <>
      <Header user={user} />
      <main id="main" className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Import supports {SUPPORTED_EXTENSIONS.join(", ")} files up to {MAX_IMPORT_BYTES / 1024 / 1024} MB.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ImportForm />
            <CreateDocumentForm />
          </div>
        </div>
        <DocumentLists mine={mine} shared={shared} />
      </main>
    </>
  );
}

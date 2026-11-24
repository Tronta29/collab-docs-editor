import { CreateDocumentForm } from "@/components/CreateDocumentForm";
import { DocumentLists } from "@/components/DocumentLists";
import { Header } from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { listDocumentsForUser } from "@/lib/documents";

export default async function Home() {
  const user = await requireUser();
  const { mine, shared } = await listDocumentsForUser(user);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <CreateDocumentForm />
        <DocumentLists mine={mine} shared={shared} />
      </main>
    </>
  );
}

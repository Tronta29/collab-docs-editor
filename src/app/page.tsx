import { Header } from "@/components/Header";
import { requireUser } from "@/lib/auth";

export default async function Home() {
  const user = await requireUser();

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Hello, {user.name}</h1>
        <p className="mt-2 text-gray-600">The dashboard arrives in Phase 2.</p>
      </main>
    </>
  );
}

import type { ReactNode } from "react";
import { OwnerActions } from "@/components/OwnerActions";
import type { listDocumentsForUser } from "@/lib/documents";

type Lists = Awaited<ReturnType<typeof listDocumentsForUser>>;

const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Section({ title, empty, items }: { title: string; empty: string; items: ReactNode[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-200 rounded border border-gray-200 bg-white">{items}</ul>
      )}
    </section>
  );
}

export function DocumentLists({ mine, shared }: Lists) {
  return (
    <>
      <Section
        title="My documents"
        empty="You don't have any documents yet. Create one above."
        items={mine.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{d.title}</p>
              <p className="text-xs text-gray-500">
                Edited {formatDate(d.updatedAt)}
                {d.shares.length > 0 && ` · Shared with ${d.shares.length} ${d.shares.length === 1 ? "person" : "people"}`}
              </p>
            </div>
            <OwnerActions id={d.id} title={d.title} />
          </li>
        ))}
      />
      <Section
        title="Shared with me"
        empty="Nothing has been shared with you yet."
        items={shared.map((d) => (
          <li key={d.id} className="px-4 py-3">
            <p className="truncate font-medium">{d.title}</p>
            <p className="text-xs text-gray-500">
              Owner: {d.owner.name} · Edited {formatDate(d.updatedAt)}
            </p>
          </li>
        ))}
      />
    </>
  );
}

import { Eye, FilePlus2, Inbox, Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DocIcon } from "@/components/DocIcon";
import { DocumentRow } from "@/components/DocumentRow";
import { RelativeTime } from "@/components/RelativeTime";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { listDocumentsForUser } from "@/lib/documents";
import { ROLE_LABEL } from "@/lib/sharing";

type Lists = Awaited<ReturnType<typeof listDocumentsForUser>>;

function Section({ title, count, empty, items }: { title: string; count: number; empty: ReactNode; items: ReactNode[] }) {
  return (
    <section className="mt-10" aria-labelledby={`${title}-heading`.replace(/\s+/g, "-")}>
      <h2 id={`${title}-heading`.replace(/\s+/g, "-")} className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">
        {title}
        <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-xs font-medium normal-case tracking-normal text-zinc-700">{count}</span>
      </h2>
      {items.length === 0 ? (
        empty
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm">{items}</ul>
      )}
    </section>
  );
}

function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="mt-3 flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-zinc-100 text-zinc-600">{icon}</span>
      <p className="mt-3 font-medium text-zinc-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-600">{children}</p>
    </div>
  );
}

export function DocumentLists({ mine, shared }: Lists) {
  return (
    <>
      <Section
        title="My documents"
        count={mine.length}
        empty={
          <EmptyState icon={<FilePlus2 size={22} aria-hidden />} title="No documents yet">
            Create your first document with <strong className="font-medium">New document</strong>, or import a file.
          </EmptyState>
        }
        items={mine.map((d) => (
          <DocumentRow key={d.id} id={d.id} title={d.title} updatedAt={d.updatedAt.toISOString()} sharedCount={d.shares.length} />
        ))}
      />
      <Section
        title="Shared with me"
        count={shared.length}
        empty={
          <EmptyState icon={<Inbox size={22} aria-hidden />} title="Nothing shared with you yet">
            When someone shares a document with you, it shows up here with your role.
          </EmptyState>
        }
        items={shared.map((d) => (
          <li key={d.id} className="first:rounded-t-xl last:rounded-b-xl">
            <Link href={`/docs/${d.id}`} className="flex items-center gap-3 rounded-[inherit] px-4 py-3 transition-colors hover:bg-zinc-50">
              <DocIcon />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-zinc-900">{d.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar name={d.owner.name} size="sm" />
                    <span className="sr-only">Owner: </span>
                    {d.owner.name}
                  </span>
                  <Badge tone={d.role === "EDITOR" ? "accent" : "neutral"} icon={d.role === "EDITOR" ? <Pencil size={12} aria-hidden /> : <Eye size={12} aria-hidden />}>
                    {ROLE_LABEL[d.role]}
                  </Badge>
                  <RelativeTime date={d.updatedAt.toISOString()} prefix="Edited " />
                </span>
              </span>
            </Link>
          </li>
        ))}
      />
    </>
  );
}

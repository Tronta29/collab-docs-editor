"use client";

import { ChevronDown, Download, FileDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { Menu, MenuItem } from "@/components/ui/Menu";

type Props = {
  docId: string;
  /** Called before a Markdown download so pending edits are saved first. Resolve false to cancel. */
  beforeDownload?: () => Promise<boolean>;
};

export function ExportMenu({ docId, beforeDownload }: Props) {
  async function downloadMarkdown() {
    // The export reads what is saved on the server, so save the latest edits first.
    if (beforeDownload && !(await beforeDownload())) {
      toast.error("Your latest changes couldn't be saved, so nothing was exported. Fix the save error and try again.");
      return;
    }
    const link = document.createElement("a");
    link.href = `/api/documents/${docId}/export?format=md`;
    link.download = ""; // the server names the file ("<title>.md")
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Markdown export downloaded");
  }

  function printPdf() {
    // Print styles (globals.css) hide everything except the title and the content.
    // Let the menu finish closing before the browser takes its snapshot.
    setTimeout(() => window.print(), 50);
  }

  return (
    <div className="print:hidden">
      <Menu
        label="Export"
        align="right"
        triggerClassName="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50"
        trigger={
          <>
            <Download size={15} aria-hidden />
            Export
            <ChevronDown size={14} aria-hidden className="text-zinc-500" />
          </>
        }
      >
        <MenuItem icon={<FileDown size={16} aria-hidden />} onClick={() => void downloadMarkdown()}>
          Markdown (.md)
        </MenuItem>
        <MenuItem icon={<Printer size={16} aria-hidden />} onClick={printPdf}>
          PDF (print)
        </MenuItem>
      </Menu>
    </div>
  );
}

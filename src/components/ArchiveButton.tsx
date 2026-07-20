"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";

export function ArchiveButton({
  kind,
  itemId,
  companyId,
  arhivat,
}: {
  kind: "rfq" | "deal";
  itemId: string;
  companyId: string;
  arhivat: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const baseUrl = kind === "rfq" ? `/api/rfq/${itemId}/arhiveaza` : `/api/deals/${itemId}/arhiveaza`;

  async function comuta(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (arhivat) {
        await fetch(`${baseUrl}?companyId=${companyId}`, { method: "DELETE" });
      } else {
        await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId }),
        });
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={comuta}
      disabled={loading}
      title={arhivat ? "Dezarhivează" : "Arhivează"}
      className="shrink-0 rounded-lg p-1.5 text-ink-soft/60 transition hover:bg-ink/6 hover:text-ink disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : arhivat ? (
        <ArchiveRestore className="h-3.5 w-3.5" />
      ) : (
        <Archive className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

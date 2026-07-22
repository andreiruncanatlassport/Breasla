"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminMemberActions({
  membruId,
  activ,
  potSterge,
}: {
  membruId: string;
  activ: boolean;
  potSterge: boolean; // doar adminul (nu moderatorul) poate sterge definitiv
}) {
  const router = useRouter();
  const [seIncarca, setSeIncarca] = useState(false);

  async function comutaActiv() {
    setSeIncarca(true);
    try {
      await fetch("/api/admin/membri", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: membruId, activ: !activ }),
      });
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  async function sterge() {
    if (!confirm("Ștergi definitiv acest membru? Contul, profilul și firmele lui vor fi eliminate ireversibil.")) {
      return;
    }
    setSeIncarca(true);
    try {
      const res = await fetch(`/api/admin/membri?id=${membruId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? "Nu am putut șterge membrul.");
        return;
      }
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button size="sm" variant={activ ? "secondary" : "seal"} onClick={comutaActiv} disabled={seIncarca}>
        {seIncarca ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : activ ? (
          <UserX className="h-3.5 w-3.5" />
        ) : (
          <UserCheck className="h-3.5 w-3.5" />
        )}
        {activ ? "Dezactivează" : "Reactivează"}
      </Button>
      {potSterge && (
        <Button size="sm" variant="danger" onClick={sterge} disabled={seIncarca}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, Trash2, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminMemberActions({
  membruId,
  activ,
  stareVerificare,
  potSterge,
}: {
  membruId: string;
  activ: boolean;
  stareVerificare: "nou" | "verificat" | "neverificat";
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

  async function seteazaVerificare(stare: "verificat" | "neverificat") {
    setSeIncarca(true);
    try {
      await fetch("/api/admin/membri", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: membruId, stare_verificare: stare }),
      });
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  async function respinge() {
    if (
      !confirm(
        "Respingi acest membru? Contul, profilul și orice firmă înregistrată de el vor fi șterse definitiv, ireversibil."
      )
    ) {
      return;
    }
    setSeIncarca(true);
    try {
      const res = await fetch(`/api/admin/membri?id=${membruId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? "Nu am putut respinge membrul.");
        return;
      }
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap justify-end gap-2">
      {stareVerificare !== "verificat" && (
        <Button size="sm" variant="seal" onClick={() => seteazaVerificare("verificat")} disabled={seIncarca}>
          {seIncarca ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Verifică
        </Button>
      )}
      {stareVerificare !== "neverificat" && (
        <Button size="sm" variant="secondary" onClick={() => seteazaVerificare("neverificat")} disabled={seIncarca}>
          <ShieldX className="h-3.5 w-3.5" />
          Marchează neverificat
        </Button>
      )}
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
        <Button size="sm" variant="danger" onClick={respinge} disabled={seIncarca}>
          <Trash2 className="h-3.5 w-3.5" />
          Respinge
        </Button>
      )}
    </div>
  );
}

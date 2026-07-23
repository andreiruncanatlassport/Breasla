"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea, FieldHint } from "@/components/ui/Field";

export function MaintenanceToggle({
  initialActiva,
  initialMesaj,
}: {
  initialActiva: boolean;
  initialMesaj: string | null;
}) {
  const router = useRouter();
  const [activa, setActiva] = useState(initialActiva);
  const [mesaj, setMesaj] = useState(initialMesaj ?? "");
  const [seSalveaza, setSeSalveaza] = useState(false);

  async function comuta(activeazaAcum: boolean) {
    setSeSalveaza(true);
    try {
      const res = await fetch("/api/admin/mentenanta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: activeazaAcum, mesaj }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? "Nu am putut schimba starea de mentenanță.");
        return;
      }
      setActiva(activeazaAcum);
      router.refresh();
    } finally {
      setSeSalveaza(false);
    }
  }

  return (
    <div
      className={`block-base p-5 ${activa ? "ring-1 ring-inset ring-ember/40 bg-ember/5" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activa ? "bg-ember/15 text-ember" : "bg-ink/6 text-ink-soft"}`}>
          <Wrench className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">Mod mentenanță</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${activa ? "bg-ember/15 text-ember" : "bg-ink/6 text-ink-soft"}`}>
              {activa ? "ACTIV — doar tu vezi site-ul" : "Oprit — site-ul e vizibil pentru toți"}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Cât timp e activ, orice vizitator (inclusiv membri logați, în afară de admin/moderator) e
            redirecționat către o pagină de mentenanță. Tu continui să vezi tot site-ul normal, ca să
            verifici o schimbare înainte s-o vadă restul.
          </p>

          <div className="mt-3">
            <Textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Mesaj personalizat (opțional) — ex: «Facem o actualizare, revenim în 30 de minute.»"
              maxLength={500}
              className="min-h-[70px] text-sm"
            />
            <FieldHint>Lasă gol pentru mesajul implicit.</FieldHint>
          </div>

          <div className="mt-3">
            {activa ? (
              <Button variant="secondary" size="sm" onClick={() => comuta(false)} disabled={seSalveaza}>
                {seSalveaza ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Oprește mentenanța
              </Button>
            ) : (
              <Button variant="danger" size="sm" onClick={() => comuta(true)} disabled={seSalveaza}>
                {seSalveaza ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Activează mentenanța
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

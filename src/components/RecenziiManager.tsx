"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, FileText, Loader2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface RecenziePending {
  id: string;
  rating: number;
  comentariu: string | null;
  status: string;
  created_at: string;
  reviewer: { id: string; denumire: string } | null;
  reviewed: { id: string; denumire: string } | null;
}

export function RecenziiManager({ recenziiInitiale }: { recenziiInitiale: RecenziePending[] }) {
  const [recenzii, setRecenzii] = useState(recenziiInitiale);
  const [seIncarca, setSeIncarca] = useState<string | null>(null);

  async function vadDovada(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}/dovada`);
    const json = await res.json();
    if (json?.data?.url) window.open(json.data.url, "_blank");
  }

  async function decide(id: string, actiune: "approve" | "reject") {
    setSeIncarca(id);
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actiune }),
      });
      setRecenzii((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setSeIncarca(null);
    }
  }

  if (recenzii.length === 0) {
    return <p className="text-sm text-ink-soft">Nicio recenzie în așteptare — bravo!</p>;
  }

  return (
    <div className="space-y-4">
      {recenzii.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-ink-soft">
                <Link href={`/firma/${r.reviewer?.id}`} className="font-medium text-ink hover:text-seal">
                  {r.reviewer?.denumire}
                </Link>{" "}
                despre{" "}
                <Link href={`/firma/${r.reviewed?.id}`} className="font-medium text-ink hover:text-seal">
                  {r.reviewed?.denumire}
                </Link>
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < r.rating ? "fill-seal text-seal" : "text-ink/20"}`}
                  />
                ))}
              </div>
              {r.comentariu && <p className="mt-2 text-sm text-ink-soft">{r.comentariu}</p>}
            </div>
            <Badge tone="warning">în așteptare</Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => vadDovada(r.id)}>
              <FileText className="h-3.5 w-3.5" /> Vezi dovada
            </Button>
            <Button size="sm" onClick={() => decide(r.id, "approve")} disabled={seIncarca === r.id}>
              {seIncarca === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aprobă"}
            </Button>
            <Button size="sm" variant="danger" onClick={() => decide(r.id, "reject")} disabled={seIncarca === r.id}>
              Respinge
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

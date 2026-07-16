"use client";

import { useState } from "react";
import { UserPlus, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Stare = "none" | "pending_sent" | "pending_received" | "accepted" | "declined";

interface Props {
  targetCompanyId: string;
  connectionId: string | null;
  stareInitiala: Stare;
  autentificat: boolean;
}

export function ConnectButton({ targetCompanyId, connectionId, stareInitiala, autentificat }: Props) {
  const [stare, setStare] = useState<Stare>(stareInitiala);
  const [id, setId] = useState<string | null>(connectionId);
  const [seIncarca, setSeIncarca] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  if (!autentificat) {
    return (
      <a href="/login" className="text-sm font-medium text-seal hover:underline">
        Autentifică-te pentru a trimite o cerere de conexiune
      </a>
    );
  }

  async function trimiteCerere() {
    setSeIncarca(true);
    setEroare(null);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_company_id: targetCompanyId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      setId(json.data.id);
      setStare("pending_sent");
    } finally {
      setSeIncarca(false);
    }
  }

  async function raspunde(actiune: "accept" | "decline") {
    if (!id) return;
    setSeIncarca(true);
    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actiune }),
      });
      if (res.ok) setStare(actiune === "accept" ? "accepted" : "declined");
    } finally {
      setSeIncarca(false);
    }
  }

  if (stare === "accepted") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-teal">
        <Check className="h-4 w-4" /> Conectat — vezi datele de contact mai jos
      </span>
    );
  }

  if (stare === "pending_sent") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60">
        <Clock className="h-4 w-4" /> Cerere trimisă, în așteptare
      </span>
    );
  }

  if (stare === "pending_received") {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => raspunde("accept")} disabled={seIncarca}>Acceptă</Button>
        <Button size="sm" variant="secondary" onClick={() => raspunde("decline")} disabled={seIncarca}>
          Refuză
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button size="sm" onClick={trimiteCerere} disabled={seIncarca}>
        <UserPlus className="h-4 w-4" /> Trimite cerere de conexiune
      </Button>
      {eroare && <p className="mt-1.5 text-xs text-rust">{eroare}</p>}
    </div>
  );
}

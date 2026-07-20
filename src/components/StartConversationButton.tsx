"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";

export function StartConversationButton({
  profileId,
  numeDestinatar,
  autentificat,
  size = "md",
}: {
  profileId: string;
  numeDestinatar: string;
  autentificat: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();
  const [deschis, setDeschis] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  function pornesteChat() {
    if (!autentificat) {
      router.push("/login");
      return;
    }
    setDeschis(true);
  }

  async function trimite() {
    if (!mesaj.trim()) return;
    setLoading(true);
    setEroare(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, mesaj }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut trimite mesajul.");
        return;
      }
      router.push(`/mesaje/${json.data.id}`);
    } finally {
      setLoading(false);
    }
  }

  if (!deschis) {
    return (
      <Button variant="seal" size={size} onClick={pornesteChat}>
        <MessageCircle className="h-4 w-4" />
        Trimite mesaj
      </Button>
    );
  }

  return (
    <div className="block-inset w-full max-w-sm p-4">
      <p className="stamp-label mb-2 text-ink-soft">Mesaj către {numeDestinatar}</p>
      <Textarea
        value={mesaj}
        onChange={(e) => setMesaj(e.target.value)}
        placeholder="Scrie primul mesaj..."
        className="min-h-[80px]"
        autoFocus
      />
      {eroare && <p className="mt-1.5 text-xs font-medium text-rust">{eroare}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setDeschis(false)}>
          Anulează
        </Button>
        <Button variant="seal" size="sm" onClick={trimite} disabled={loading || !mesaj.trim()}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Trimite
        </Button>
      </div>
    </div>
  );
}

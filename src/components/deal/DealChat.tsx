"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DealMessage } from "@/types/database";

interface Props {
  dealId: string;
  firmaMeaId: string;
  numeFirme: Record<string, string>;
  mesajeInitiale: DealMessage[];
}

export function DealChat({ dealId, firmaMeaId, numeFirme, mesajeInitiale }: Props) {
  const [mesaje, setMesaje] = useState<DealMessage[]>(mesajeInitiale);
  const [text, setText] = useState("");
  const [seTrimite, setSeTrimite] = useState(false);
  const finalRef = useRef<HTMLDivElement>(null);

  // Reimprospatam periodic: simplu si suficient pentru ritmul unei negocieri
  // intre firme (nu e un chat de mesagerie instant).
  useEffect(() => {
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("deal_messages")
        .select("id, deal_id, sender_company_id, continut, sistem, citit, created_at")
        .eq("deal_id", dealId)
        .order("created_at");
      if (data) setMesaje(data as DealMessage[]);
    }, 15000);
    return () => clearInterval(interval);
  }, [dealId]);

  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [mesaje.length]);

  async function trimite() {
    const continut = text.trim();
    if (!continut) return;
    setSeTrimite(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/mesaje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ continut }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setMesaje((prev) => [...prev, json.data as DealMessage]);
        setText("");
      }
    } finally {
      setSeTrimite(false);
    }
  }

  return (
    <div className="block-raised flex h-[32rem] flex-col overflow-hidden p-0">
      <div className="border-b border-line bg-ink/3 px-4 py-3">
        <p className="stamp-label text-ink-soft">Discuție</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mesaje.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">
            Niciun mesaj încă. Scrie primul.
          </p>
        )}

        {mesaje.map((m) => {
          const alMeu = m.sender_company_id === firmaMeaId;
          const nume = numeFirme[m.sender_company_id] ?? "Firmă";

          if (m.sistem) {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="rounded-full bg-ink/6 px-3 py-1 text-center text-xs text-ink-soft">
                  <strong className="font-semibold text-ink">{nume}</strong> {m.continut}
                </span>
              </div>
            );
          }

          return (
            <div key={m.id} className={`flex ${alMeu ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${alMeu ? "items-end" : "items-start"}`}>
                {!alMeu && (
                  <p className="mb-1 px-1 text-xs font-semibold text-ink-soft">{nume}</p>
                )}
                <div
                  className={
                    "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " +
                    (alMeu
                      ? "gradient-seal rounded-br-md text-white"
                      : "rounded-bl-md bg-ink/6 text-ink")
                  }
                >
                  <p className="whitespace-pre-wrap">{m.continut}</p>
                </div>
                <p className={`mt-1 px-1 font-mono-num text-[10px] text-ink-soft/60 ${alMeu ? "text-right" : ""}`}>
                  {new Date(m.created_at).toLocaleString("ro-RO", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={finalRef} />
      </div>

      <div className="border-t border-line bg-ink/3 p-3">
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                trimite();
              }
            }}
            rows={1}
            placeholder="Scrie un mesaj... (Enter trimite)"
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-seal focus:ring-3 focus:ring-seal/12"
          />
          <button
            onClick={trimite}
            disabled={seTrimite || !text.trim()}
            className="press-on-click shrink-0 rounded-xl gradient-seal px-4 text-white transition disabled:opacity-40"
          >
            {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

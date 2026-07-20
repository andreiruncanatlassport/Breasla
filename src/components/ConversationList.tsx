"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, MessageCircleOff } from "lucide-react";
import { clsx } from "clsx";

interface ConversatieRow {
  id: string;
  last_message_at: string;
  celalalt_profile_id: string | null;
  celalalt_nume: string;
  celalalt_avatar: string | null;
  ultimul_mesaj: string | null;
  ultimul_mesaj_eu: boolean;
  necitit: boolean;
}

function candDemult(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "acum";
  if (min < 60) return `${min}m`;
  const ore = Math.floor(min / 60);
  if (ore < 24) return `${ore}h`;
  const zile = Math.floor(ore / 24);
  if (zile < 7) return `${zile}z`;
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" });
}

export function ConversationList() {
  const pathname = usePathname();
  const [conversatii, setConversatii] = useState<ConversatieRow[] | null>(null);

  useEffect(() => {
    let anulat = false;
    async function incarca() {
      try {
        const res = await fetch("/api/messages");
        const json = await res.json();
        if (!anulat && json?.data) setConversatii(json.data);
      } catch {
        // reincercam la urmatorul interval
      }
    }
    incarca();
    const interval = setInterval(incarca, 15000);
    return () => {
      anulat = true;
      clearInterval(interval);
    };
  }, []);

  if (conversatii === null) {
    return <div className="space-y-2 p-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-ink/5" />)}</div>;
  }

  if (conversatii.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <MessageCircleOff className="h-8 w-8 text-ink-soft/30" strokeWidth={1.5} />
        <p className="text-sm text-ink-soft">Nicio conversație încă.</p>
        <Link href="/membri" className="text-xs font-semibold text-seal hover:underline">
          Caută membri și trimite primul mesaj
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-line">
      {conversatii.map((c) => (
        <Link
          key={c.id}
          href={`/mesaje/${c.id}`}
          className={clsx(
            "flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink/3",
            pathname === `/mesaje/${c.id}` && "bg-seal/6"
          )}
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line">
            {c.celalalt_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.celalalt_avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-soft/40">
                <UserRound className="h-5 w-5" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={clsx("truncate text-sm", c.necitit ? "font-semibold text-ink" : "font-medium text-ink")}>
                {c.celalalt_nume}
              </p>
              <span className="shrink-0 font-mono-num text-[10px] text-ink-soft/60">{candDemult(c.last_message_at)}</span>
            </div>
            <p className={clsx("truncate text-xs", c.necitit ? "font-medium text-ink" : "text-ink-soft")}>
              {c.ultimul_mesaj_eu && "Tu: "}
              {c.ultimul_mesaj ?? "—"}
            </p>
          </div>
          {c.necitit && <span className="h-2 w-2 shrink-0 rounded-full bg-seal" />}
        </Link>
      ))}
    </div>
  );
}

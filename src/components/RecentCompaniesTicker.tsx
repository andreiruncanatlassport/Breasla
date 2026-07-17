"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface FirmaRecenta {
  id: string;
  denumire: string;
}

export function RecentCompaniesTicker() {
  const [firme, setFirme] = useState<FirmaRecenta[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("companies")
      .select("id, denumire")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setFirme((data as FirmaRecenta[]) ?? []));
  }, []);

  if (firme.length === 0) return null;

  return (
    <div className="relative border-t border-line bg-surface/60 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="stamp-label shrink-0 text-ink-soft/70">Recent verificate</span>
        {firme.map((f) => (
          <Link
            key={f.id}
            href={`/firma/${f.id}`}
            className="lift-on-hover flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-soft shadow-[var(--shadow-sm)] transition hover:border-seal hover:text-ink"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal shadow-[0_0_6px_var(--color-teal)]" />
            {f.denumire}
          </Link>
        ))}
      </div>
    </div>
  );
}

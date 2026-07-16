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
    <div className="relative border-t border-line bg-paper-white/60 py-4">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink/45">
          Recent verificate
        </span>
        {firme.map((f) => (
          <Link
            key={f.id}
            href={`/firma/${f.id}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper-white px-3 py-1.5 text-xs font-medium text-ink/75 transition hover:border-seal hover:text-ink"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            {f.denumire}
          </Link>
        ))}
      </div>
    </div>
  );
}

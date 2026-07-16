"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() {
  const [numar, setNumar] = useState(0);

  useEffect(() => {
    let anulat = false;

    async function incarca() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companii } = await supabase.from("companies").select("id").eq("owner_id", user.id);
      const idFirme = ((companii as { id: string }[] | null) ?? []).map((c) => c.id);
      if (idFirme.length === 0) return;

      const { count } = await supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .in("target_company_id", idFirme)
        .eq("status", "pending");

      if (!anulat) setNumar(count ?? 0);
    }

    incarca();
    const interval = setInterval(incarca, 60_000);
    return () => {
      anulat = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link href="/dashboard" className="relative rounded-full p-2 opacity-80 transition hover:bg-white/10 hover:opacity-100">
      <Bell className="h-[18px] w-[18px]" />
      {numar > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-seal px-1 text-[10px] font-bold text-primary-content">
          {numar > 9 ? "9+" : numar}
        </span>
      )}
    </Link>
  );
}

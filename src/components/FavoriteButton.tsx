"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FavoriteButton({ companyId }: { companyId: string }) {
  const [salvat, setSalvat] = useState(false);
  const [autentificat, setAutentificat] = useState(false);
  const [seIncarca, setSeIncarca] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setSeIncarca(false);
        return;
      }
      setAutentificat(true);
      const { data: fav } = await supabase
        .from("company_favorites")
        .select("company_id")
        .eq("profile_id", data.user.id)
        .eq("company_id", companyId)
        .maybeSingle();
      setSalvat(Boolean(fav));
      setSeIncarca(false);
    });
  }, [companyId]);

  async function comuta() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (salvat) {
      await supabase.from("company_favorites").delete().eq("profile_id", user.id).eq("company_id", companyId);
      setSalvat(false);
    } else {
      await supabase.from("company_favorites").insert({ profile_id: user.id, company_id: companyId } as never);
      setSalvat(true);
    }
  }

  if (!autentificat || seIncarca) return null;

  return (
    <button
      onClick={comuta}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        salvat ? "border-seal bg-seal/10 text-seal" : "border-line text-ink-soft hover:border-ink/40"
      }`}
    >
      <Bookmark className={`h-3.5 w-3.5 ${salvat ? "fill-seal" : ""}`} />
      {salvat ? "Salvată" : "Salvează"}
    </button>
  );
}

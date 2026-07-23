import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "@/components/ui/BrandMark";

export const metadata = { title: "Mentenanță — ACDR" };

export default async function MentenantaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("mentenanta_activa, mentenanta_mesaj")
    .eq("id", true)
    .maybeSingle();

  const setari = data as { mentenanta_activa: boolean; mentenanta_mesaj: string | null } | null;

  // Daca cineva ajunge aici direct (link salvat, refresh) cand mentenanta nu
  // mai e activa, nu are rost sa vada un mesaj fals — il trimitem acasa.
  if (!setari?.mentenanta_activa) redirect("/");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 py-16 text-center">
      <BrandMark className="h-12 w-12" />
      <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-seal/10">
        <Wrench className="h-6 w-6 text-seal" strokeWidth={1.8} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Facem puțină curățenie</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        {setari.mentenanta_mesaj?.trim() ||
          "Platforma e temporar în mentenanță — actualizăm ceva. Revino în câteva minute."}
      </p>
    </div>
  );
}

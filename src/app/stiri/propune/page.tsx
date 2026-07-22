import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProposeNewsForm } from "@/components/ProposeNewsForm";

export default async function PropuneStirePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="stamp-label text-seal">Comunitate</p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Propune o știre</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Ai o veste bună despre firma ta sau despre comunitate? Trimite-o mai jos — un administrator o analizează
        și, dacă e potrivită, o publică pe pagina de Știri.
      </p>
      <div className="mt-8">
        <ProposeNewsForm />
      </div>
    </div>
  );
}

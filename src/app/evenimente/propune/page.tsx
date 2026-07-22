import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProposeEventForm } from "@/components/ProposeEventForm";

export default async function PropuneEvenimentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="stamp-label text-seal">Comunitate</p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Propune un eveniment</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Organizezi ceva relevant pentru comunitate? Trimite detaliile mai jos — un administrator le analizează
        și, dacă e potrivit, îl publică pe pagina de Evenimente.
      </p>
      <div className="mt-8">
        <ProposeEventForm />
      </div>
    </div>
  );
}

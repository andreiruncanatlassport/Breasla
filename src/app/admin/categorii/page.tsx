import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoriiManager } from "@/components/CategoriiManager";
import type { Profile } from "@/types/database";

export default async function AdminCategoriiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-semibold text-ink">Categorii & coduri CAEN</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Taxonomia de start e un draft funcțional. Adaugă sau elimină coduri CAEN pe măsură ce vezi
        ce firme se înregistrează, pentru o mapare tot mai precisă.
      </p>
      <div className="mt-8">
        <CategoriiManager />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { RecenziiManager } from "@/components/RecenziiManager";

export default async function AdminRecenziiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const { data } = await supabase
    .from("reviews")
    .select(
      "id, rating, comentariu, status, created_at, reviewer:reviewer_company_id(id, denumire), reviewed:reviewed_company_id(id, denumire)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-semibold text-ink">Recenzii în așteptare</h1>
      <p className="mt-1.5 text-sm text-ink/60">
        Aprobă doar recenziile cu o dovadă de colaborare credibilă (contract, comandă, corespondență).
      </p>
      <div className="mt-8">
        <RecenziiManager recenziiInitiale={(data ?? []) as never} />
      </div>
    </div>
  );
}

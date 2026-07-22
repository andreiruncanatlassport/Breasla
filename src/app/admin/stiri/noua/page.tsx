import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewsForm } from "@/components/admin/NewsForm";
import type { Profile } from "@/types/database";

export default async function AdminStireNouaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="stamp-label text-seal">Administrare</p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Știre nouă</h1>
      <div className="mt-8">
        <NewsForm />
      </div>
    </div>
  );
}

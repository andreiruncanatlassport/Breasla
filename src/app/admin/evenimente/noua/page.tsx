import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/EventForm";
import type { Profile } from "@/types/database";

export default async function AdminEvenimentNouPage() {
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
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Eveniment nou</h1>
      <div className="mt-8">
        <EventForm />
      </div>
    </div>
  );
}

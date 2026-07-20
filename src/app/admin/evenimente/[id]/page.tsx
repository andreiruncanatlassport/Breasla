import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/EventForm";
import type { Profile, EventItem } from "@/types/database";

export default async function AdminEvenimentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  const eveniment = data as EventItem | null;
  if (!eveniment) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="stamp-label text-seal">Administrare</p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Editează evenimentul</h1>
      <div className="mt-8">
        <EventForm initial={eveniment} />
      </div>
    </div>
  );
}

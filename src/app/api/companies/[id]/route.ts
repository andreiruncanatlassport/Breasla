import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { areReauthValid } from "@/lib/reauth";

// Campuri pe care proprietarul are voie sa le editeze dupa inregistrare.
// (status, aprobat_de, aprobat_la, cui sunt oricum protejate si la nivel de
// baza de date de trigger-ul companies_protect_moderation — vezi migratii.)
const CAMPURI_EDITABILE = [
  "telefon_firma",
  "email_firma",
  "website",
  "descriere",
  "logo_url",
  "banner_url",
  "facebook_url",
  "instagram_url",
  "linkedin_url",
  "tags",
  "timp_raspuns",
  "discount_procent",
  "discount_descriere",
  "discount_conditii",
  "proiect_marime",
  "numar_angajati",
  "dimensiune_echipa",
  "raza_deservire_km",
  "cum_poate_ajuta_grupul",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const esteAdmin = (profile as { rol: string } | null)?.rol === "admin" || (profile as { rol: string } | null)?.rol === "moderator";

  if (!esteAdmin && !(await areReauthValid(supabase, user.id))) {
    return NextResponse.json(
      { error: "Reconfirmă-ți identitatea prin email înainte de a edita profilul.", cod: "REAUTH_REQUIRED" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const camp of CAMPURI_EDITABILE) {
    if (camp in body) patch[camp] = body[camp];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Niciun câmp de actualizat." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("companies")
    .update(patch as never)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const esteAdmin = (profile as { rol: string } | null)?.rol === "admin" || (profile as { rol: string } | null)?.rol === "moderator";

  if (!esteAdmin && !(await areReauthValid(supabase, user.id))) {
    return NextResponse.json(
      { error: "Reconfirmă-ți identitatea prin email înainte de a șterge firma.", cod: "REAUTH_REQUIRED" },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("companies").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true } });
}

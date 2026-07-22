import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { areReauthValid } from "@/lib/reauth";
import { mesajEroareSigur } from "@/lib/api-errors";

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
  "zona_deservita",
  "cum_poate_ajuta_grupul",
] as const;

// Campuri text cu check constraint (enum) in baza de date, ale caror select-uri
// din formular au o optiune implicita cu valoare "" ("Alege..."). Fara aceasta
// conversie, "" ajunge la Postgres si incalca constrangerea (ex: companies_dimensiune_echipa_check).
const CAMPURI_ENUM_NULLABILE = new Set<string>(["dimensiune_echipa", "timp_raspuns", "proiect_marime"]);

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
    if (camp in body) {
      const valoare = body[camp];
      patch[camp] = CAMPURI_ENUM_NULLABILE.has(camp) && valoare === "" ? null : valoare;
    }
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
    return NextResponse.json(
      { error: mesajEroareSigur(error, "PATCH /api/companies/[id]") },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: mesajEroareSigur(error, "DELETE /api/companies/[id]") },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { deleted: true } });
}

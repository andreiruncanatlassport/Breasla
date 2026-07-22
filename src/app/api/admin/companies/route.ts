import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { mesajEroareSigur } from "@/lib/api-errors";

/** Verifica ca cel care cere e admin/moderator. Returneaza user-ul sau null. */
async function verificaAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, rol: null };
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol ?? null;
  return { user, rol };
}

/**
 * POST /api/admin/companies — creare manuala completa a unei firme din panoul
 * de admin. Adminul scrie toate datele (nu trece prin ANAF). Firma e aprobata
 * direct si atribuita adminului ca owner (poate fi reatribuita ulterior).
 */
export async function POST(request: Request) {
  const { user, rol } = await verificaAdmin();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Nu ai drepturi de administrare." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });

  const denumire = typeof body.denumire === "string" ? body.denumire.trim() : "";
  const cuiRaw = body.cui;
  const cui = typeof cuiRaw === "number" ? cuiRaw : Number(String(cuiRaw ?? "").replace(/\D/g, ""));

  if (!denumire) return NextResponse.json({ error: "Denumirea firmei e obligatorie." }, { status: 400 });
  if (!cui || Number.isNaN(cui)) {
    return NextResponse.json({ error: "CUI-ul e obligatoriu și trebuie să fie numeric." }, { status: 400 });
  }

  // Folosim service role: adminul poate crea firme atribuite altcuiva, iar
  // insertul ocoleste politica "un user isi creeaza propria firma" (care cere
  // owner_id = auth.uid()). Ownerul implicit e adminul care o creeaza.
  const admin = createServiceRoleClient();

  // CUI unic — verificam intai, ca sa dam un mesaj clar in loc de eroare bruta.
  const { data: existenta } = await admin.from("companies").select("id").eq("cui", cui).maybeSingle();
  if (existenta) {
    return NextResponse.json({ error: "Există deja o firmă cu acest CUI." }, { status: 409 });
  }

  const insert: Record<string, unknown> = {
    owner_id: user.id,
    cui,
    denumire,
    status: "approved",
    nr_reg_com: body.nr_reg_com?.trim() || null,
    judet_cod: body.judet_cod || null,
    localitate: body.localitate?.trim() || null,
    telefon_firma: body.telefon_firma?.trim() || null,
    email_firma: body.email_firma?.trim() || null,
    website: body.website?.trim() || null,
    descriere: body.descriere?.trim() || null,
    domenii_altele: body.domenii_altele?.trim() || null,
  };

  const { data, error } = await admin
    .from("companies")
    .insert(insert as never)
    .select("id, slug, denumire")
    .single();

  if (error) {
    return NextResponse.json(
      { error: mesajEroareSigur(error, "POST /api/admin/companies") },
      { status: 500 }
    );
  }

  await admin.from("admin_audit_log").insert({
    admin_id: user.id,
    company_id: (data as { id: string }).id,
    actiune: "manual_create",
    detalii: { denumire, cui },
  } as never);

  return NextResponse.json({ data });
}

/**
 * DELETE /api/admin/companies?id=... — stergere definitiva a unei firme din
 * panoul de admin (cascada in DB sterge si datele asociate).
 */
export async function DELETE(request: Request) {
  const { user, rol } = await verificaAdmin();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Nu ai drepturi de administrare." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID firmă lipsă." }, { status: 400 });

  const admin = createServiceRoleClient();
  const { error } = await admin.from("companies").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      {
        error: mesajEroareSigur(error, "DELETE /api/admin/companies", {
          "23503": "Nu am putut șterge firma — încă mai există date asociate care fac referire la ea. Contactează suportul tehnic.",
        }),
      },
      { status: 500 }
    );
  }

  await admin.from("admin_audit_log").insert({
    admin_id: user.id,
    company_id: id,
    actiune: "manual_delete",
    detalii: null,
  } as never);

  return NextResponse.json({ data: { deleted: true } });
}

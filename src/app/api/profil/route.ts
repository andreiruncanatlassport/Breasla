import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

const MAX_BIO = 600;
const MAX_CAUTA_SUPORT = 300;

/** Actualizeaza campurile publice ale profilului (pagina de Membri). */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });

  const update: Record<string, unknown> = {};

  if (typeof body.titlu === "string") update.titlu = body.titlu.trim().slice(0, 120) || null;
  if (typeof body.bio === "string") update.bio = body.bio.trim().slice(0, MAX_BIO) || null;
  if (typeof body.oras === "string") update.oras = body.oras.trim().slice(0, 120) || null;
  if (typeof body.judet_cod === "string") update.judet_cod = body.judet_cod.trim().slice(0, 8) || null;
  if (typeof body.firma_declarata === "string") {
    update.firma_declarata = body.firma_declarata.trim().slice(0, 160) || null;
  }
  if (typeof body.linkedin_url === "string") {
    update.linkedin_url = body.linkedin_url.trim().slice(0, 300) || null;
  }
  if (typeof body.cauta_suport === "string") {
    update.cauta_suport = body.cauta_suport.trim().slice(0, MAX_CAUTA_SUPORT) || null;
  }
  if (Array.isArray(body.cauta_suport_category_ids)) {
    update.cauta_suport_category_ids = body.cauta_suport_category_ids.filter((id: unknown) => typeof id === "string");
  }
  if (typeof body.avatar_url === "string" || body.avatar_url === null) update.avatar_url = body.avatar_url;
  if (typeof body.public_vizibil === "boolean") update.public_vizibil = body.public_vizibil;
  if (typeof body.nume_complet === "string" && body.nume_complet.trim()) {
    update.nume_complet = body.nume_complet.trim().slice(0, 160);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update as never)
    .eq("id", user.id)
    .select(
      "id, nume_complet, avatar_url, titlu, bio, oras, judet_cod, firma_declarata, linkedin_url, cauta_suport, cauta_suport_category_ids, public_vizibil"
    )
    .single();

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "PATCH src/app/api/profil/route.ts") }, { status: 500 });

  return NextResponse.json({ data });
}

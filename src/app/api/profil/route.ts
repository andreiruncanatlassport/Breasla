import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BIO = 600;

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
    .select("id, nume_complet, avatar_url, titlu, bio, oras, public_vizibil")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

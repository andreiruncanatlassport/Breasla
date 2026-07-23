import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import type { Profile } from "@/types/database";

/**
 * PATCH /api/admin/mentenanta — activeaza/dezactiveaza modul de mentenanta.
 * body: { activa: boolean, mesaj?: string }
 * Cat timp e activ, doar admin/moderator mai vede site-ul normal (vezi
 * src/lib/supabase/middleware.ts) — restul sunt redirectionati catre
 * /mentenanta.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Nu ai drepturi de administrare." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.activa !== "boolean") {
    return NextResponse.json({ error: "Date invalide (activa: boolean necesar)." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      mentenanta_activa: body.activa,
      mentenanta_mesaj: typeof body.mesaj === "string" ? body.mesaj.trim().slice(0, 500) || null : null,
      mentenanta_activata_de: body.activa ? user.id : null,
      mentenanta_activata_la: body.activa ? new Date().toISOString() : null,
    } as never)
    .eq("id", true);

  if (error) {
    return NextResponse.json(
      { error: mesajEroareSigur(error, "PATCH /api/admin/mentenanta") },
      { status: 500 }
    );
  }

  await admin.from("admin_audit_log").insert({
    admin_id: user.id,
    actiune: body.activa ? "mentenanta_activata" : "mentenanta_dezactivata",
    detalii: { mesaj: body.mesaj ?? null },
  } as never);

  return NextResponse.json({ data: { activa: body.activa } });
}

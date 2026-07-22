import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { mesajEroareSigur } from "@/lib/api-errors";

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
 * PATCH /api/admin/membri — dezactiveaza/reactiveaza un membru si/sau ii
 * schimba starea de verificare (nou/verificat/neverificat).
 * body: { id, activ?: boolean, stare_verificare?: "nou" | "verificat" | "neverificat" }
 */
export async function PATCH(request: Request) {
  const { user, rol } = await verificaAdmin();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Nu ai drepturi de administrare." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const activ = body?.activ;
  const stareVerificare = body?.stare_verificare as string | undefined;

  if (!id || (typeof activ !== "boolean" && stareVerificare === undefined)) {
    return NextResponse.json(
      { error: "Date invalide (id + activ sau stare_verificare necesare)." },
      { status: 400 }
    );
  }
  if (stareVerificare !== undefined && !["nou", "verificat", "neverificat"].includes(stareVerificare)) {
    return NextResponse.json({ error: "Stare de verificare invalidă." }, { status: 400 });
  }

  if (id === user.id) {
    return NextResponse.json({ error: "Nu te poți dezactiva pe tine însuți." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof activ === "boolean") patch.activ = activ;
  if (stareVerificare !== undefined) patch.stare_verificare = stareVerificare;

  const admin = createServiceRoleClient();
  const { error } = await admin.from("profiles").update(patch as never).eq("id", id);
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "PATCH src/app/api/admin/membri/route.ts") }, { status: 500 });

  if (stareVerificare !== undefined) {
    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      actiune: `membru_${stareVerificare}`,
      detalii: { profile_id: id },
    } as never);
  }

  return NextResponse.json({ data: { id, activ, stare_verificare: stareVerificare } });
}

/**
 * DELETE /api/admin/membri?id=... — stergere definitiva a unui membru.
 * Sterge randul din auth.users (cascada sterge si profilul + datele legate).
 */
export async function DELETE(request: Request) {
  const { user, rol } = await verificaAdmin();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  if (rol !== "admin") {
    // stergerea definitiva a unui cont e rezervata adminului (nu moderatorului)
    return NextResponse.json({ error: "Doar un administrator poate șterge conturi." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID membru lipsă." }, { status: 400 });
  if (id === user.id) {
    return NextResponse.json({ error: "Nu te poți șterge pe tine însuți." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  // Stergem contul de auth; profilul si datele asociate se sterg in cascada
  // (profiles.id -> auth.users cu on delete cascade).
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "DELETE src/app/api/admin/membri/route.ts") }, { status: 500 });

  return NextResponse.json({ data: { deleted: true } });
}

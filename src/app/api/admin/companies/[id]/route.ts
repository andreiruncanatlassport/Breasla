import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

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
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Nu ai drepturi de administrare." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const actiune = body?.actiune as "approve" | "reject" | "suspend" | undefined;
  if (!actiune) {
    return NextResponse.json({ error: "Acțiune lipsă." }, { status: 400 });
  }

  const statusMap = { approve: "approved", reject: "rejected", suspend: "suspended" } as const;
  const status = statusMap[actiune];

  const { error } = await supabase
    .from("companies")
    .update({
      status,
      motiv_respingere: actiune === "reject" ? body?.motiv ?? null : null,
      aprobat_de: user.id,
      aprobat_la: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: user.id,
    company_id: id,
    actiune: `manual_${actiune}`,
    detalii: body?.motiv ? { motiv: body.motiv } : null,
  } as never);

  return NextResponse.json({ data: { status } });
}

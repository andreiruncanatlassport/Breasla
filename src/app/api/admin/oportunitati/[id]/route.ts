import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";
import type { Profile } from "@/types/database";

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
 * PATCH /api/admin/oportunitati/[id] — aproba ('deschisa') sau respinge
 * ('respinsa') o oportunitate aflata in asteptare (sau schimba starea in
 * general, ex. redeschide una respinsa din greseala).
 * body: { status: "deschisa" | "respinsa" | "in_asteptare" | "inchisa" }
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, rol } = await verificaAdmin();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Nu ai drepturi de administrare." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status as string | undefined;
  if (!status || !["in_asteptare", "deschisa", "respinsa", "inchisa"].includes(status)) {
    return NextResponse.json({ error: "Stare invalidă." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.from("opportunities").update({ status } as never).eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: mesajEroareSigur(error, "PATCH /api/admin/oportunitati/[id]") },
      { status: 500 }
    );
  }

  await admin.from("admin_audit_log").insert({
    admin_id: user.id,
    actiune: `oportunitate_${status}`,
    detalii: { opportunity_id: id },
  } as never);

  return NextResponse.json({ data: { id, status } });
}

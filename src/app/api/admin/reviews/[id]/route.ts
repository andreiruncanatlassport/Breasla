import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { mesajEroareSigur } from "@/lib/api-errors";

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
  const actiune = body?.actiune as "approve" | "reject" | undefined;
  if (!actiune) {
    return NextResponse.json({ error: "Acțiune lipsă." }, { status: 400 });
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      status: actiune === "approve" ? "approved" : "rejected",
      motiv_respingere: actiune === "reject" ? body?.motiv ?? null : null,
      aprobat_de: user.id,
      aprobat_la: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: mesajEroareSigur(error, "PATCH src/app/api/admin/reviews/[id]/route.ts") }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}

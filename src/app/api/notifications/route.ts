import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

/** Ultimele notificari + numarul celor necitite (pentru clopotelul din header). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ data: { notificari: [], necitite: 0 } });

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, tip, titlu, mesaj, link, citit, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("citit", false),
  ]);

  return NextResponse.json({ data: { notificari: data ?? [], necitite: count ?? 0 } });
}

/** Marcheaza notificarile ca citite. */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  let q = supabase.from("notifications").update({ citit: true } as never).eq("citit", false);
  if (body?.id) q = q.eq("id", body.id);

  const { error } = await q;
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "PATCH src/app/api/notifications/route.ts") }, { status: 500 });

  return NextResponse.json({ data: { ok: true } });
}

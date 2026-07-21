import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/recomandari — recomanzi un membru. RLS impune ca ai schimbat
 * mesaje cu el (altfel insertul e respins de politica).
 * body: { recommended_id, mesaj? }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const recommendedId = body?.recommended_id as string | undefined;
  if (!recommendedId) return NextResponse.json({ error: "Membru lipsă." }, { status: 400 });
  if (recommendedId === user.id) {
    return NextResponse.json({ error: "Nu te poți recomanda pe tine." }, { status: 400 });
  }

  const { error } = await supabase.from("member_recommendations").insert({
    recommender_id: user.id,
    recommended_id: recommendedId,
    mesaj: typeof body?.mesaj === "string" ? body.mesaj.trim().slice(0, 300) || null : null,
  } as never);

  if (error) {
    // 23505 = deja exista (unique), 42501 / policy = nu ai mesajerit cu el
    if (error.code === "23505") {
      return NextResponse.json({ error: "L-ai recomandat deja." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Poți recomanda doar membri cu care ai schimbat mesaje." },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: { ok: true } });
}

/**
 * DELETE /api/recomandari?id=... — retragi propria recomandare (id = membrul recomandat).
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const recommendedId = searchParams.get("id");
  if (!recommendedId) return NextResponse.json({ error: "Membru lipsă." }, { status: 400 });

  const { error } = await supabase
    .from("member_recommendations")
    .delete()
    .eq("recommender_id", user.id)
    .eq("recommended_id", recommendedId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}

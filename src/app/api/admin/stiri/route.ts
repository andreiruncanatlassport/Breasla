import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const titlu = String(body?.titlu || "").trim();
  const continut = String(body?.continut || "").trim();
  if (!titlu || !continut) {
    return NextResponse.json({ error: "Titlul și conținutul sunt obligatorii." }, { status: 400 });
  }

  const status = body?.status === "publicat" ? "publicat" : "draft";

  // RLS (public.news_articles) permite scriere doar adminilor/moderatorilor.
  const { data, error } = await supabase
    .from("news_articles")
    .insert({
      autor_id: user.id,
      titlu,
      rezumat: body?.rezumat ? String(body.rezumat).trim().slice(0, 280) : null,
      continut,
      imagine_url: body?.imagine_url || null,
      status,
      published_at: status === "publicat" ? new Date().toISOString() : null,
    } as never)
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

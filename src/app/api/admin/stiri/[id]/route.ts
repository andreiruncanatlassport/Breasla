import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.titlu === "string") update.titlu = body.titlu.trim();
  if (typeof body.rezumat === "string") update.rezumat = body.rezumat.trim().slice(0, 280) || null;
  if (typeof body.continut === "string") update.continut = body.continut.trim();
  if (typeof body.imagine_url === "string" || body.imagine_url === null) update.imagine_url = body.imagine_url;
  if (body.status === "publicat" || body.status === "draft") {
    update.status = body.status;
    if (body.status === "publicat") update.published_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 });
  }

  // RLS permite editare doar adminilor/moderatorilor.
  const { data, error } = await supabase
    .from("news_articles")
    .update(update as never)
    .eq("id", id)
    .select("id, slug, status")
    .single();

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "PATCH src/app/api/admin/stiri/[id]/route.ts") }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const { error } = await supabase.from("news_articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "DELETE src/app/api/admin/stiri/[id]/route.ts") }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}

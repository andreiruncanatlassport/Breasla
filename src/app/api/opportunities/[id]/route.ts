import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Editeaza sau inchide/redeschide o oportunitate — doar proprietarul firmei sau admin (RLS). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const patch: Record<string, unknown> = {};

  if (body?.status && ["deschisa", "inchisa"].includes(body.status)) patch.status = body.status;
  if (typeof body?.titlu === "string") patch.titlu = body.titlu.trim();
  if (typeof body?.descriere === "string") patch.descriere = body.descriere.trim();
  if (typeof body?.tip === "string") patch.tip = body.tip;
  if ("category_id" in (body ?? {})) patch.category_id = body.category_id || null;
  if ("judet_cod" in (body ?? {})) patch.judet_cod = body.judet_cod || null;
  if ("buget_min" in (body ?? {})) patch.buget_min = body.buget_min ? Number(body.buget_min) : null;
  if ("buget_max" in (body ?? {})) patch.buget_max = body.buget_max ? Number(body.buget_max) : null;
  if ("termen_limita" in (body ?? {})) patch.termen_limita = body.termen_limita || null;
  if ("imagine_url" in (body ?? {})) patch.imagine_url = body.imagine_url || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 });
  }

  const { error } = await supabase.from("opportunities").update(patch as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { ok: true } });
}

/** Sterge o oportunitate — doar proprietarul firmei sau admin (RLS). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { ok: true } });
}

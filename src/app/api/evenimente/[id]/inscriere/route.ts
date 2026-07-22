import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const { data: eveniment } = await supabase
    .from("events")
    .select("id, capacitate, status")
    .eq("id", eventId)
    .maybeSingle();

  const ev = eveniment as { id: string; capacitate: number | null; status: string } | null;
  if (!ev || ev.status !== "publicat") {
    return NextResponse.json({ error: "Evenimentul nu este disponibil pentru înscriere." }, { status: 404 });
  }

  if (ev.capacitate) {
    const { count } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);
    if ((count ?? 0) >= ev.capacitate) {
      return NextResponse.json({ error: "Nu mai sunt locuri disponibile la acest eveniment." }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from("event_registrations")
    .insert({
      event_id: eventId,
      profile_id: user.id,
      nota: body?.nota ? String(body.nota).trim().slice(0, 280) : null,
    } as never)
    .select("id")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: mesajEroareSigur(error, "POST src/app/api/evenimente/[id]/inscriere/route.ts", { "23505": "Ești deja înscris la acest eveniment." }) },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "DELETE /api/evenimente/[id]/inscriere") }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}

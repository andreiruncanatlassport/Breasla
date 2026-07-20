import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creeazaNotificare } from "@/lib/notifications";

interface ParticipantRow {
  profile_id: string;
  profiles: { nume_complet: string; avatar_url: string | null } | null;
}

/** Mesajele unei conversatii + celalalt participant. Marcheaza si ca citit. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const { data: participSelf } = await supabase
    .from("conversation_participants")
    .select("profile_id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!participSelf) {
    return NextResponse.json({ error: "Nu ai acces la această conversație." }, { status: 403 });
  }

  const [{ data: participantiData }, { data: mesajeData }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("profile_id, profiles(nume_complet, avatar_url)")
      .eq("conversation_id", conversationId)
      .neq("profile_id", user.id),
    supabase
      .from("direct_messages")
      .select("id, conversation_id, sender_id, continut, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  const celalalt = ((participantiData as unknown as ParticipantRow[]) ?? [])[0] ?? null;

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() } as never)
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id);

  return NextResponse.json({
    data: {
      mesaje: mesajeData ?? [],
      celalalt_profile_id: celalalt?.profile_id ?? null,
      celalalt_nume: celalalt?.profiles?.nume_complet ?? "Membru șters",
      celalalt_avatar: celalalt?.profiles?.avatar_url ?? null,
    },
  });
}

/** Trimite un mesaj nou intr-o conversatie existenta. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const continut = String(body?.continut || "").trim();
  if (!continut) return NextResponse.json({ error: "Mesaj gol." }, { status: 400 });

  const { data: participSelf } = await supabase
    .from("conversation_participants")
    .select("profile_id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!participSelf) {
    return NextResponse.json({ error: "Nu ai acces la această conversație." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, continut } as never)
    .select("id, conversation_id, sender_id, continut, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: altiiData } = await supabase
    .from("conversation_participants")
    .select("profile_id")
    .eq("conversation_id", conversationId)
    .neq("profile_id", user.id);

  const { data: profilMeu } = await supabase.from("profiles").select("nume_complet").eq("id", user.id).maybeSingle();
  const numeMeu = (profilMeu as { nume_complet: string } | null)?.nume_complet ?? "Un membru";

  for (const p of (altiiData as { profile_id: string }[]) ?? []) {
    await creeazaNotificare({
      profileId: p.profile_id,
      tip: "mesaj_nou",
      titlu: `Mesaj nou de la ${numeMeu}`,
      mesaj: continut.length > 120 ? `${continut.slice(0, 120)}...` : continut,
      link: `/mesaje/${conversationId}`,
    });
  }

  return NextResponse.json({ data });
}

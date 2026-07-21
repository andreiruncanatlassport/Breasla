import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { creeazaNotificare } from "@/lib/notifications";

interface ParticipantRow {
  conversation_id: string;
  profile_id: string;
  profiles: { nume_complet: string; avatar_url: string | null } | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  continut: string;
  created_at: string;
}

/** Lista conversatiilor mele, cu celalalt participant si ultimul mesaj. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const { data: aleMeleData } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("profile_id", user.id);

  const aleMele = (aleMeleData as { conversation_id: string; last_read_at: string | null }[]) ?? [];
  const idUri = aleMele.map((r) => r.conversation_id);

  if (idUri.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const lastReadMap = new Map(aleMele.map((r) => [r.conversation_id, r.last_read_at]));

  const [{ data: conversatiiData }, { data: participantiData }, { data: mesajeData }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, created_at, last_message_at")
      .in("id", idUri)
      .order("last_message_at", { ascending: false }),
    supabase
      .from("conversation_participants")
      .select("conversation_id, profile_id, profiles(nume_complet, avatar_url)")
      .in("conversation_id", idUri)
      .neq("profile_id", user.id),
    supabase
      .from("direct_messages")
      .select("id, conversation_id, sender_id, continut, created_at")
      .in("conversation_id", idUri)
      .order("created_at", { ascending: false }),
  ]);

  const conversatii = (conversatiiData as { id: string; created_at: string; last_message_at: string }[]) ?? [];
  const participanti = (participantiData as unknown as ParticipantRow[]) ?? [];
  const mesaje = (mesajeData as MessageRow[]) ?? [];

  const participantMap = new Map(participanti.map((p) => [p.conversation_id, p]));
  const lastMessageMap = new Map<string, MessageRow>();
  for (const m of mesaje) {
    if (!lastMessageMap.has(m.conversation_id)) lastMessageMap.set(m.conversation_id, m);
  }

  const rezultat = conversatii.map((c) => {
    const celalalt = participantMap.get(c.id);
    const ultimulMesaj = lastMessageMap.get(c.id) ?? null;
    const lastRead = lastReadMap.get(c.id);
    const necitit = Boolean(
      ultimulMesaj && ultimulMesaj.sender_id !== user.id && (!lastRead || new Date(ultimulMesaj.created_at) > new Date(lastRead))
    );
    return {
      id: c.id,
      last_message_at: c.last_message_at,
      celalalt_profile_id: celalalt?.profile_id ?? null,
      celalalt_nume: celalalt?.profiles?.nume_complet ?? "Membru șters",
      celalalt_avatar: celalalt?.profiles?.avatar_url ?? null,
      ultimul_mesaj: ultimulMesaj?.continut ?? null,
      ultimul_mesaj_eu: ultimulMesaj?.sender_id === user.id,
      necitit,
    };
  });

  return NextResponse.json({ data: rezultat });
}

/** Porneste (sau reia) o conversatie 1:1 si trimite primul mesaj. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const profileId = String(body?.profileId || "");
  const mesaj = String(body?.mesaj || "").trim();

  if (!profileId || profileId === user.id) {
    return NextResponse.json({ error: "Destinatar invalid." }, { status: 400 });
  }
  if (!mesaj) {
    return NextResponse.json({ error: "Scrie un mesaj înainte de a trimite." }, { status: 400 });
  }

  // Folosim service role aici — RLS pe `profiles` restrictioneaza vizibilitatea
  // datelor la profil propriu/conexiune acceptata, dar mesageria e deschisa
  // intre orice membri, deci verificarea tintei trebuie sa ocoleasca acea regula.
  const admin = createServiceRoleClient();
  const { data: tinta } = await admin
    .from("profiles")
    .select("id, nume_complet, activ")
    .eq("id", profileId)
    .maybeSingle();

  const tintaProfil = tinta as { id: string; nume_complet: string; activ: boolean } | null;
  if (!tintaProfil || !tintaProfil.activ) {
    return NextResponse.json({ error: "Acest membru nu mai este disponibil." }, { status: 404 });
  }

  // cautam o conversatie 1:1 existenta intre cei doi
  const { data: aleMeleData } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id);
  const idUriProprii = ((aleMeleData as { conversation_id: string }[]) ?? []).map((r) => r.conversation_id);

  let conversationId: string | null = null;
  if (idUriProprii.length > 0) {
    const { data: comuna } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", profileId)
      .in("conversation_id", idUriProprii)
      .limit(1)
      .maybeSingle();
    conversationId = (comuna as { conversation_id: string } | null)?.conversation_id ?? null;
  }

  if (!conversationId) {
    // crearea conversatiei + participantilor se face cu service role, pentru
    // ca niciun user nu are policy de insert direct pe aceste doua tabele
    // (evitam conversatii "orfane" create de oricine, fara al doilea participant).
    const { data: convNoua, error: convErr } = await admin
      .from("conversations")
      .insert({} as never)
      .select("id")
      .single();

    if (convErr || !convNoua) {
      return NextResponse.json({ error: convErr?.message ?? "Nu am putut porni conversația." }, { status: 500 });
    }
    conversationId = (convNoua as { id: string }).id;

    const { error: partErr } = await admin.from("conversation_participants").insert([
      { conversation_id: conversationId, profile_id: user.id },
      { conversation_id: conversationId, profile_id: profileId },
    ] as never);

    if (partErr) {
      return NextResponse.json({ error: partErr.message }, { status: 500 });
    }
  }

  const { error: msgErr } = await supabase.from("direct_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    continut: mesaj,
  } as never);

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  const { data: profilMeu } = await supabase.from("profiles").select("nume_complet").eq("id", user.id).maybeSingle();
  const numeMeu = (profilMeu as { nume_complet: string } | null)?.nume_complet ?? "Un membru";

  await creeazaNotificare({
    profileId,
    tip: "mesaj_nou",
    titlu: `Mesaj nou de la ${numeMeu}`,
    mesaj: mesaj.length > 120 ? `${mesaj.slice(0, 120)}...` : mesaj,
    link: `/mesaje/${conversationId}`,
  });

  return NextResponse.json({ data: { id: conversationId } });
}

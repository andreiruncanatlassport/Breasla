import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Numarul de conversatii cu mesaje necitite — folosit pentru badge-ul
 * "(N)" de pe tab-ul Mesaje din header si din bara de navigare mobila.
 * Aceeasi logica de "necitit" ca in GET /api/messages (ultimul mesaj al
 * conversatiei nu e al meu si e mai nou decat ultima citire).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ data: { count: 0 } });

  const { data: aleMeleData } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("profile_id", user.id);

  const aleMele = (aleMeleData as { conversation_id: string; last_read_at: string | null }[]) ?? [];
  if (aleMele.length === 0) return NextResponse.json({ data: { count: 0 } });

  const idUri = aleMele.map((r) => r.conversation_id);
  const lastReadMap = new Map(aleMele.map((r) => [r.conversation_id, r.last_read_at]));

  const { data: mesajeData } = await supabase
    .from("direct_messages")
    .select("conversation_id, sender_id, created_at")
    .in("conversation_id", idUri)
    .order("created_at", { ascending: false });

  const mesaje = (mesajeData as { conversation_id: string; sender_id: string; created_at: string }[]) ?? [];

  const lastMessageMap = new Map<string, { sender_id: string; created_at: string }>();
  for (const m of mesaje) {
    if (!lastMessageMap.has(m.conversation_id)) lastMessageMap.set(m.conversation_id, m);
  }

  let count = 0;
  for (const convId of idUri) {
    const ultimul = lastMessageMap.get(convId);
    const lastRead = lastReadMap.get(convId);
    if (ultimul && ultimul.sender_id !== user.id && (!lastRead || new Date(ultimul.created_at) > new Date(lastRead))) {
      count++;
    }
  }

  return NextResponse.json({ data: { count } });
}

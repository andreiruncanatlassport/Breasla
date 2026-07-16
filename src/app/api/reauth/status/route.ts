import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FEREASTRA_MINUTE = 15;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const { data } = await supabase
    .from("reauth_confirmations")
    .select("confirmed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const confirmedAt = (data as { confirmed_at: string } | null)?.confirmed_at;
  const valid =
    Boolean(confirmedAt) &&
    Date.now() - new Date(confirmedAt as string).getTime() < FEREASTRA_MINUTE * 60 * 1000;

  return NextResponse.json({ data: { valid } });
}

import type { SupabaseClient } from "@supabase/supabase-js";

const FEREASTRA_MINUTE = 15;

/** Adevarat daca userul si-a reconfirmat emailul in ultimele 15 minute. */
export async function areReauthValid(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("reauth_confirmations")
    .select("confirmed_at")
    .eq("user_id", userId)
    .maybeSingle();

  const confirmedAt = (data as { confirmed_at: string } | null)?.confirmed_at;
  if (!confirmedAt) return false;

  return Date.now() - new Date(confirmedAt).getTime() < FEREASTRA_MINUTE * 60 * 1000;
}

import { createServiceRoleClient } from "@/lib/supabase/server";

export interface AdminStats {
  membriTotal: number;
  membriActivi: number;
  membriNoi7z: number;
  membriVerificati: number;
  firmeTotal: number;
  firmeAprobate: number;
  firmePending: number;
  firmeNoi7z: number;
  mesajeTotal: number;
  mesaje7z: number;
  conversatiiTotal: number;
  recomandariTotal: number;
  oportunitatiDeschise: number;
  stiriPublicate: number;
  evenimenteViitoare: number;
  recenziiPending: number;
}

function acum() {
  return Date.now();
}

/**
 * Aduna toate cifrele de care are nevoie panoul de admin, folosind
 * service role (adminul vede tot, ocolind RLS). Folosim count head-only ca
 * sa fie rapid, fara sa aducem randuri.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const admin = createServiceRoleClient();
  const acum7z = new Date(acum() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const acumISO = new Date(acum()).toISOString();

  const c = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

  const [
    membriTotal,
    membriActivi,
    membriNoi7z,
    firmeTotal,
    firmeAprobate,
    firmePending,
    firmeNoi7z,
    mesajeTotal,
    mesaje7z,
    conversatiiTotal,
    recomandariTotal,
    oportunitatiDeschise,
    stiriPublicate,
    evenimenteViitoare,
    recenziiPending,
  ] = await Promise.all([
    c(admin.from("profiles").select("id", { count: "exact", head: true })),
    c(admin.from("profiles").select("id", { count: "exact", head: true }).eq("activ", true)),
    c(admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", acum7z)),
    c(admin.from("companies").select("id", { count: "exact", head: true })),
    c(admin.from("companies").select("id", { count: "exact", head: true }).eq("status", "approved")),
    c(admin.from("companies").select("id", { count: "exact", head: true }).eq("status", "pending")),
    c(admin.from("companies").select("id", { count: "exact", head: true }).gte("created_at", acum7z)),
    c(admin.from("direct_messages").select("id", { count: "exact", head: true })),
    c(admin.from("direct_messages").select("id", { count: "exact", head: true }).gte("created_at", acum7z)),
    c(admin.from("conversations").select("id", { count: "exact", head: true })),
    c(admin.from("member_recommendations").select("id", { count: "exact", head: true })),
    c(admin.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "deschisa")),
    c(admin.from("news_articles").select("id", { count: "exact", head: true }).eq("status", "publicat")),
    c(
      admin
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "publicat")
        .gte("data_inceput", acumISO)
    ),
    c(admin.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending")),
  ]);

  // membrii verificati (5+ recomandari) — numaram prin agregare pe recomandari
  const { data: recoRows } = await admin.from("member_recommendations").select("recommended_id");
  const contor = new Map<string, number>();
  for (const r of (recoRows as { recommended_id: string }[]) ?? []) {
    contor.set(r.recommended_id, (contor.get(r.recommended_id) ?? 0) + 1);
  }
  let membriVerificati = 0;
  for (const n of contor.values()) if (n >= 5) membriVerificati++;

  return {
    membriTotal,
    membriActivi,
    membriNoi7z,
    membriVerificati,
    firmeTotal,
    firmeAprobate,
    firmePending,
    firmeNoi7z,
    mesajeTotal,
    mesaje7z,
    conversatiiTotal,
    recomandariTotal,
    oportunitatiDeschise,
    stiriPublicate,
    evenimenteViitoare,
    recenziiPending,
  };
}

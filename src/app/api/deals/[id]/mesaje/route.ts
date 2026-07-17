import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificaFirma } from "@/lib/notifications";
import type { Deal } from "@/types/database";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
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

  const { data: dealData } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!dealData) return NextResponse.json({ error: "Înțelegerea nu există." }, { status: 404 });
  const deal = dealData as Deal;

  const { data: firmeleMele } = await supabase
    .from("companies")
    .select("id, denumire")
    .eq("owner_id", user.id)
    .eq("status", "approved");

  const firme = (firmeleMele as { id: string; denumire: string }[] | null) ?? [];
  const firmaMea = firme.find((f) => f.id === deal.company_a_id || f.id === deal.company_b_id);
  if (!firmaMea) {
    return NextResponse.json({ error: "Nu faci parte din această înțelegere." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("deal_messages")
    .insert({ deal_id: dealId, sender_company_id: firmaMea.id, continut } as never)
    .select("id, continut, created_at, sender_company_id, sistem")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cealaltaFirma = firmaMea.id === deal.company_a_id ? deal.company_b_id : deal.company_a_id;
  await notificaFirma(cealaltaFirma, {
    tip: "deal_mesaj",
    titlu: `Mesaj nou de la ${firmaMea.denumire}`,
    mesaj: continut.length > 120 ? `${continut.slice(0, 120)}...` : continut,
    link: `/dashboard/intelegeri/${dealId}`,
  });

  return NextResponse.json({ data });
}

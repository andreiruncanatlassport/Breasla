import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificaFirma } from "@/lib/notifications";
import type { Deal, DealVersion } from "@/types/database";

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
  if (!body) return NextResponse.json({ error: "Date invalide." }, { status: 400 });

  // RLS ne lasa sa citim doar intelegerile la care participam.
  const { data: dealData } = await supabase.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!dealData) return NextResponse.json({ error: "Înțelegerea nu există." }, { status: 404 });
  const deal = dealData as Deal;

  if (deal.status === "finalizat" || deal.status === "anulat") {
    return NextResponse.json(
      { error: "Înțelegerea e închisă; nu mai poți propune modificări." },
      { status: 400 }
    );
  }

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

  // Urmatorul numar de versiune
  const { data: ultima } = await supabase
    .from("deal_versions")
    .select("id, numar")
    .eq("deal_id", dealId)
    .order("numar", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ultimaVersiune = ultima as Pick<DealVersion, "id" | "numar"> | null;
  const numarNou = (ultimaVersiune?.numar ?? 0) + 1;

  const { data: versiune, error } = await supabase
    .from("deal_versions")
    .insert({
      deal_id: dealId,
      numar: numarNou,
      propus_de: firmaMea.id,
      descriere_lucrare: body.descriere_lucrare ?? null,
      pret_total: body.pret_total ?? null,
      moneda: body.moneda === "EUR" ? "EUR" : "RON",
      modalitate_plata: body.modalitate_plata ?? null,
      termen_start: body.termen_start || null,
      termen_final: body.termen_final || null,
      clauze: body.clauze ?? [],
      etape: body.etape ?? [],
      nota_modificare: body.nota_modificare ?? null,
      raspuns_la: ultimaVersiune?.id ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !versiune) {
    return NextResponse.json({ error: error?.message ?? "Nu am putut salva versiunea." }, { status: 500 });
  }

  // Versiunea anterioara devine "inlocuita"; intelegerea intra in negociere.
  if (ultimaVersiune) {
    await supabase
      .from("deal_versions")
      .update({ status: "inlocuita" } as never)
      .eq("id", ultimaVersiune.id)
      .eq("status", "propusa");
  }

  await supabase
    .from("deals")
    .update({ status: "negociere", versiune_acceptata_id: null } as never)
    .eq("id", dealId);

  // Mesaj de sistem in chat, ca istoricul sa fie complet intr-un singur loc
  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_company_id: firmaMea.id,
    continut: `a propus versiunea ${numarNou}${body.nota_modificare ? `: ${body.nota_modificare}` : ""}`,
    sistem: true,
  } as never);

  const cealaltaFirma = firmaMea.id === deal.company_a_id ? deal.company_b_id : deal.company_a_id;
  await notificaFirma(cealaltaFirma, {
    tip: "deal_propunere",
    titlu: `${firmaMea.denumire} a propus termeni noi`,
    mesaj: `Versiunea ${numarNou} pentru "${deal.titlu}". Poți accepta sau propune o contra-ofertă.`,
    link: `/dashboard/intelegeri/${dealId}`,
  });

  return NextResponse.json({ data: { id: (versiune as { id: string }).id, numar: numarNou } });
}

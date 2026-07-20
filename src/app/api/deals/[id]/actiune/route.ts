import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificaFirma } from "@/lib/notifications";
import type { Deal } from "@/types/database";

type Actiune = "accepta" | "finalizeaza" | "anuleaza";

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
  const actiune = body?.actiune as Actiune | undefined;
  if (!actiune) return NextResponse.json({ error: "Acțiune lipsă." }, { status: 400 });

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

  const suntA = firmaMea.id === deal.company_a_id;
  const cealaltaFirma = suntA ? deal.company_b_id : deal.company_a_id;

  // ---- ACCEPTĂ o versiune propusă -----------------------------------------
  if (actiune === "accepta") {
    const versiuneId = body?.versiune_id;
    if (!versiuneId) return NextResponse.json({ error: "Versiune lipsă." }, { status: 400 });

    const { data: v } = await supabase
      .from("deal_versions")
      .select("id, numar, propus_de, status")
      .eq("id", versiuneId)
      .maybeSingle();

    const versiune = v as { id: string; numar: number; propus_de: string; status: string } | null;
    if (!versiune) return NextResponse.json({ error: "Versiunea nu există." }, { status: 404 });

    // Nu-ti poti accepta singur propria propunere — ar goli acordul de sens.
    if (versiune.propus_de === firmaMea.id) {
      return NextResponse.json(
        { error: "Propria propunere trebuie acceptată de cealaltă firmă." },
        { status: 400 }
      );
    }
    if (versiune.status !== "propusa") {
      return NextResponse.json({ error: "Această versiune nu mai e activă." }, { status: 400 });
    }

    await supabase.from("deal_versions").update({ status: "acceptata" } as never).eq("id", versiuneId);
    await supabase
      .from("deals")
      .update({ status: "acceptat", versiune_acceptata_id: versiuneId } as never)
      .eq("id", dealId);

    await supabase.from("deal_messages").insert({
      deal_id: dealId,
      sender_company_id: firmaMea.id,
      continut: `a acceptat versiunea ${versiune.numar}. Înțelegerea e stabilită.`,
      sistem: true,
    } as never);

    await notificaFirma(cealaltaFirma, {
      tip: "deal_acceptat",
      titlu: `${firmaMea.denumire} a acceptat termenii`,
      mesaj: `Înțelegerea "${deal.titlu}" e stabilită pe versiunea ${versiune.numar}.`,
      link: `/dashboard/intelegeri/${dealId}`,
    });

    return NextResponse.json({ data: { status: "acceptat" } });
  }

  // ---- FINALIZEAZĂ (ambele părți trebuie să confirme) ----------------------
  if (actiune === "finalizeaza") {
    if (deal.status !== "acceptat" && deal.status !== "finalizat") {
      return NextResponse.json(
        { error: "Puteți marca finalizarea doar după ce ați acceptat termenii." },
        { status: 400 }
      );
    }

    const acum = new Date().toISOString();
    const patch: Record<string, unknown> = suntA
      ? { finalizat_de_a_la: acum }
      : { finalizat_de_b_la: acum };

    const celalaltAConfirmat = suntA ? deal.finalizat_de_b_la : deal.finalizat_de_a_la;
    if (celalaltAConfirmat) patch.status = "finalizat";

    await supabase.from("deals").update(patch as never).eq("id", dealId);

    await supabase.from("deal_messages").insert({
      deal_id: dealId,
      sender_company_id: firmaMea.id,
      continut: celalaltAConfirmat
        ? "a confirmat finalizarea. Colaborarea e încheiată."
        : "a marcat colaborarea ca finalizată. Se așteaptă confirmarea celeilalte firme.",
      sistem: true,
    } as never);

    await notificaFirma(cealaltaFirma, {
      tip: "deal_finalizat",
      titlu: celalaltAConfirmat
        ? `Colaborarea cu ${firmaMea.denumire} e încheiată`
        : `${firmaMea.denumire} a marcat colaborarea ca finalizată`,
      mesaj: celalaltAConfirmat
        ? "Acum puteți lăsa recenzii — sunt verificate automat, fără dovezi."
        : "Confirmă și tu finalizarea, ca să puteți lăsa recenzii verificate.",
      link: `/dashboard/intelegeri/${dealId}`,
    });

    return NextResponse.json({
      data: { status: celalaltAConfirmat ? "finalizat" : "acceptat", asteptareConfirmare: !celalaltAConfirmat },
    });
  }

  // ---- ANULEAZĂ ------------------------------------------------------------
  if (actiune === "anuleaza") {
    if (deal.status === "finalizat") {
      return NextResponse.json({ error: "O colaborare finalizată nu poate fi anulată." }, { status: 400 });
    }

    await supabase
      .from("deals")
      .update({ status: "anulat", anulat_de: firmaMea.id, motiv_anulare: body?.motiv ?? null } as never)
      .eq("id", dealId);

    await supabase.from("deal_messages").insert({
      deal_id: dealId,
      sender_company_id: firmaMea.id,
      continut: `a anulat înțelegerea${body?.motiv ? `: ${body.motiv}` : "."}`,
      sistem: true,
    } as never);

    return NextResponse.json({ data: { status: "anulat" } });
  }

  return NextResponse.json({ error: "Acțiune necunoscută." }, { status: 400 });
}

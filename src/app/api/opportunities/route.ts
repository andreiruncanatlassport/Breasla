import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

/** Publica o oportunitate noua, in numele unei firme detinute de userul curent. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const companyId = String(body?.company_id || "");
  const titlu = String(body?.titlu || "").trim();
  const descriere = String(body?.descriere || "").trim();
  const tip = String(body?.tip || "proiect");

  if (!companyId || !titlu || !descriere) {
    return NextResponse.json({ error: "Titlul, descrierea și firma sunt obligatorii." }, { status: 400 });
  }
  if (!["proiect", "achizitie", "colaborare", "cerere_servicii"].includes(tip)) {
    return NextResponse.json({ error: "Tip invalid." }, { status: 400 });
  }

  const { data: firma } = await supabase
    .from("companies")
    .select("id, owner_id, status")
    .eq("id", companyId)
    .maybeSingle();
  const firmaRow = firma as { id: string; owner_id: string; status: string } | null;
  if (!firmaRow || firmaRow.owner_id !== user.id) {
    return NextResponse.json({ error: "Firma nu îți aparține." }, { status: 403 });
  }
  if (firmaRow.status !== "approved") {
    return NextResponse.json({ error: "Doar o firmă verificată poate posta o oportunitate." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      company_id: companyId,
      titlu,
      descriere,
      tip,
      category_id: body?.category_id || null,
      judet_cod: body?.judet_cod || null,
      buget_min: body?.buget_min ? Number(body.buget_min) : null,
      buget_max: body?.buget_max ? Number(body.buget_max) : null,
      termen_limita: body?.termen_limita || null,
      imagine_url: body?.imagine_url || null,
    } as never)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "POST src/app/api/opportunities/route.ts") }, { status: 500 });

  return NextResponse.json({ data });
}

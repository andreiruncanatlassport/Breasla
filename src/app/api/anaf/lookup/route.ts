import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lookupCompanyByCui } from "@/lib/anaf";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cui = Number(body?.cui);

  if (!cui || !Number.isInteger(cui) || cui <= 0) {
    return NextResponse.json({ error: "CUI invalid." }, { status: 400 });
  }

  // CUI deja inregistrat? spunem asta direct, ca sa nu mai facem request la ANAF degeaba
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("cui", cui)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Această firmă (CUI) este deja înregistrată în platformă." },
      { status: 409 }
    );
  }

  try {
    const data = await lookupCompanyByCui(cui);
    if (!data.gasita) {
      return NextResponse.json(
        { error: "CUI-ul nu a fost găsit la ANAF. Verifică dacă e corect." },
        { status: 404 }
      );
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("ANAF lookup error", err);
    return NextResponse.json(
      { error: "Serviciul ANAF nu a răspuns. Încearcă din nou în câteva momente." },
      { status: 502 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchLatestBilant } from "@/lib/anaf";

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

  try {
    const bilant = await fetchLatestBilant(cui);
    // null e un raspuns valid (firma noua, fara bilant depus inca) — nu e eroare
    return NextResponse.json({ data: bilant });
  } catch (err) {
    console.error("ANAF bilant error", err);
    return NextResponse.json({ data: null });
  }
}

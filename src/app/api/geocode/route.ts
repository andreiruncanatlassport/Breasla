import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const adresa = String(body?.adresa || "").trim();

  if (!adresa) {
    return NextResponse.json({ error: "Adresă lipsă." }, { status: 400 });
  }

  try {
    const rezultat = await geocodeAddress(adresa, body?.localitate, body?.judet);
    return NextResponse.json({ data: rezultat });
  } catch (err) {
    console.error("Geocode error", err);
    return NextResponse.json({ data: null });
  }
}

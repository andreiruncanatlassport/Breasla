import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.category_id || !body?.caen_code) {
    return NextResponse.json({ error: "Date incomplete." }, { status: 400 });
  }

  // RLS (public.category_caen_codes) permite scriere doar adminilor/moderatorilor —
  // requestul va esua automat daca userul nu are dreptul.
  const { data, error } = await supabase
    .from("category_caen_codes")
    .insert({
      category_id: body.category_id,
      caen_code: String(body.caen_code).trim(),
      caen_version: body.caen_version === "rev3" ? "rev3" : "rev2",
      descriere: body.descriere ?? null,
    } as never)
    .select("id")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: mesajEroareSigur(error, "POST src/app/api/admin/caen/route.ts", { "23505": "Acest cod CAEN e deja atribuit acestei categorii." }) },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ data });
}

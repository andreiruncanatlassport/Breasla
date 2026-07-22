import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { reviewed_company_id, rating, comentariu, dovada_url } = body ?? {};

  if (!reviewed_company_id || !rating) {
    return NextResponse.json({ error: "Date incomplete." }, { status: 400 });
  }
  if (!dovada_url) {
    return NextResponse.json(
      { error: "Adaugă o dovadă a colaborării (contract, comandă etc.)." },
      { status: 400 }
    );
  }

  const { data: myCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (!myCompany) {
    return NextResponse.json(
      { error: "Trebuie să ai o firmă verificată ca să lași o recenzie." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      reviewer_company_id: (myCompany as { id: string }).id,
      reviewed_company_id,
      rating,
      comentariu: comentariu ?? null,
      dovada_url,
    } as never)
    .select("id")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: mesajEroareSigur(error, "POST src/app/api/reviews/route.ts", { "23505": "Ai lăsat deja o recenzie acestei firme." }) },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ data });
}

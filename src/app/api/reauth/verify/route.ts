import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cod = String(body?.cod || "").trim();
  if (!cod) {
    return NextResponse.json({ error: "Introdu codul primit pe email." }, { status: 400 });
  }

  const { error } = await supabase.auth.verifyOtp({
    email: user.email,
    token: cod,
    type: "email",
  });

  if (error) {
    return NextResponse.json(
      { error: "Cod incorect sau expirat. Cere unul nou și încearcă din nou." },
      { status: 400 }
    );
  }

  await supabase
    .from("reauth_confirmations")
    .upsert({ user_id: user.id, confirmed_at: new Date().toISOString() } as never);

  return NextResponse.json({ data: { confirmat: true } });
}

import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

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

  // Marcam ca verificat folosind service_role — trigger-ul din baza de date
  // (profiles_protect_email_verificat) blocheaza intentionat acest camp pentru
  // utilizatorii obisnuiti, ca nimeni sa nu se poata auto-verifica din browser.
  const admin = createServiceRoleClient();
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      email_verificat: true,
      email_verificat_la: new Date().toISOString(),
    } as never)
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: mesajEroareSigur(updateError, "POST /api/verificare-email/confirma") },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { verificat: true } });
}

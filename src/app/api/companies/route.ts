import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

interface CategorieInput {
  category_id: string;
  is_primary?: boolean;
}
interface NevoieOfertaInput {
  category_id: string | null;
  nota?: string;
}

/**
 * Decide daca o firma poate fi aprobata automat (fara interventia unui admin).
 * Regula: firma trebuie sa existe la ANAF, sa NU fie radiata si starea de
 * inregistrare sa nu contina mentiuni de radiere/dizolvare/inactivare.
 */
function decideAutoApprove(input: {
  radiata: boolean;
  stareInregistrare: string | null;
}): boolean {
  if (input.radiata) return false;
  const stare = (input.stareInregistrare || "").toLowerCase();
  if (stare.includes("radiat") || stare.includes("dizolvat") || stare.includes("inactiv")) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  // Validam EXACT campurile marcate cu steluta in formular — restul sunt
  // optionale si nu trebuie sa blocheze trimiterea. Aratam clar ce lipseste,
  // in loc de un mesaj generic "Date incomplete" care nu ajuta pe nimeni.
  const categorii: CategorieInput[] = Array.isArray(body.categorii) ? body.categorii : [];
  const lipsesc: string[] = [];
  if (!body.cui) lipsesc.push("CUI");
  if (!body.denumire) lipsesc.push("Denumirea firmei (caută din nou la ANAF)");
  if (!body.judet_cod) lipsesc.push("Județul sediului");
  if (!body.localitate || !String(body.localitate).trim()) lipsesc.push("Localitatea");
  if (!body.telefon_firma || String(body.telefon_firma).length !== 10) {
    lipsesc.push("Telefonul firmei (10 cifre)");
  }
  if (!body.dimensiune_echipa) lipsesc.push("Dimensiunea echipei");
  if (!body.zona_deservita || !String(body.zona_deservita).trim()) lipsesc.push("Zona deservită");
  if (categorii.length === 0) lipsesc.push("Cel puțin un domeniu de activitate");
  else if (!categorii.some((c) => c.is_primary)) lipsesc.push("Domeniul principal (alege unul dintre cele bifate)");

  if (lipsesc.length > 0) {
    return NextResponse.json(
      { error: `Completează înainte de a trimite: ${lipsesc.join(", ")}.` },
      { status: 400 }
    );
  }

  // 1) Inregistram firma (status implicit 'pending', impus si de RLS)
  const { data: company, error: insertError } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      cui: body.cui,
      denumire: body.denumire,
      nr_reg_com: body.nr_reg_com ?? null,
      adresa_sediu: body.adresa_sediu ?? null,
      judet_cod: body.judet_cod ?? null,
      localitate: body.localitate ?? null,
      cod_postal: body.cod_postal ?? null,
      stare_inregistrare: body.stare_inregistrare ?? null,
      data_inregistrare: body.data_inregistrare ?? null,
      radiata: Boolean(body.radiata),
      cod_caen_principal: body.cod_caen_principal ?? null,
      den_caen_principal: body.den_caen_principal ?? null,
      tva_activ: body.tva_activ ?? null,
      anaf_ultima_verificare: new Date().toISOString(),
      anaf_raspuns_brut: body.anaf_raspuns_brut ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      raza_deservire_km: body.raza_deservire_km ?? null,
      zona_deservita: typeof body.zona_deservita === "string" && body.zona_deservita.trim() ? body.zona_deservita.trim().slice(0, 200) : null,
      telefon_firma: body.telefon_firma ?? null,
      email_firma: body.email_firma ?? null,
      website: body.website ?? null,
      descriere: body.descriere ?? null,
      domenii_altele: typeof body.domenii_altele === "string" && body.domenii_altele.trim() ? body.domenii_altele.trim().slice(0, 300) : null,
      domenii_cautate_altele: typeof body.domenii_cautate_altele === "string" && body.domenii_cautate_altele.trim() ? body.domenii_cautate_altele.trim().slice(0, 300) : null,
      numar_angajati: body.numar_angajati ?? null,
      dimensiune_echipa: body.dimensiune_echipa || null,
      cifra_afaceri_an: body.cifra_afaceri_an ?? null,
      cifra_afaceri_valoare: body.cifra_afaceri_valoare ?? null,
      cifra_afaceri_sursa: body.cifra_afaceri_sursa ?? null,
      cum_poate_ajuta_grupul: body.cum_poate_ajuta_grupul ?? null,
    } as never)
    .select("id")
    .single();

  if (insertError || !company) {
    if (insertError) {
      // Detalii tehnice doar in log-urile serverului (Railway) — niciodata in fata userului.
      console.error("Eroare la salvarea firmei (companies insert):", insertError);
    }
    const isDuplicate = insertError?.code === "23505";
    const isCheckViolation = insertError?.code === "23514";
    return NextResponse.json(
      {
        error: isDuplicate
          ? "Această firmă (CUI) este deja înregistrată."
          : isCheckViolation
            ? "Una dintre valorile completate nu este validă. Verifică formularul și încearcă din nou."
            : "Nu am putut salva firma. Te rugăm încearcă din nou sau contactează-ne dacă problema persistă.",
      },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const companyId = (company as { id: string }).id;

  // 2) Inseram datele asociate (categorii, judete suplimentare, nevoi, oferte)
  if (categorii.length > 0) {
    await supabase.from("company_categories").insert(
      categorii.map((c) => ({
        company_id: companyId,
        category_id: c.category_id,
        is_primary: Boolean(c.is_primary),
      })) as never
    );
  }

  const categoriiCautate: string[] = Array.isArray(body.categorii_cautate) ? body.categorii_cautate : [];
  if (categoriiCautate.length > 0) {
    await supabase.from("company_categorii_cautate").insert(
      categoriiCautate.map((categoryId) => ({ company_id: companyId, category_id: categoryId })) as never
    );
  }

  const judeteSuplimentare: string[] = Array.isArray(body.judete_suplimentare)
    ? body.judete_suplimentare
    : [];
  if (judeteSuplimentare.length > 0) {
    await supabase.from("company_judete").insert(
      judeteSuplimentare.map((cod) => ({ company_id: companyId, judet_cod: cod })) as never
    );
  }

  const nevoi: NevoieOfertaInput[] = Array.isArray(body.nevoi) ? body.nevoi : [];
  if (nevoi.length > 0) {
    await supabase.from("company_support_needs").insert(
      nevoi.map((n) => ({
        company_id: companyId,
        category_id: n.category_id,
        nota: n.nota ?? null,
      })) as never
    );
  }

  const oferte: NevoieOfertaInput[] = Array.isArray(body.oferte) ? body.oferte : [];
  if (oferte.length > 0) {
    await supabase.from("company_support_offers").insert(
      oferte.map((o) => ({
        company_id: companyId,
        category_id: o.category_id,
        nota: o.nota ?? null,
      })) as never
    );
  }

  if (body.cifra_afaceri_an && body.cifra_afaceri_valoare != null) {
    await supabase.from("financial_snapshots").insert({
      company_id: companyId,
      an: body.cifra_afaceri_an,
      cifra_afaceri: body.cifra_afaceri_valoare,
      profit_net: body.profit_net ?? null,
      numar_salariati: body.numar_angajati ?? null,
      sursa: body.cifra_afaceri_sursa === "manual" ? "manual" : "anaf_auto",
    } as never);
  }

  // 3) Decizia de aprobare semi-automata — facuta cu clientul service_role,
  // ca sa poata modifica status/aprobat_la (owner-ul normal nu poate, vezi RLS).
  const autoApprove = decideAutoApprove({
    radiata: Boolean(body.radiata),
    stareInregistrare: body.stare_inregistrare ?? null,
  });

  let finalStatus: "pending" | "approved" = "pending";

  if (autoApprove) {
    const admin = createServiceRoleClient();
    const { error: updateError } = await admin
      .from("companies")
      .update({ status: "approved", aprobat_la: new Date().toISOString() } as never)
      .eq("id", companyId);

    if (!updateError) {
      finalStatus = "approved";
      await admin.from("admin_audit_log").insert({
        company_id: companyId,
        actiune: "auto_approve",
        detalii: { motiv: "CUI activ la ANAF, verificare automata" },
      } as never);
    }
  }

  return NextResponse.json({ data: { id: companyId, status: finalStatus } });
}

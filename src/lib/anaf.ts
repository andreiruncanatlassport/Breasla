/**
 * Integrare cu API-urile publice si gratuite ale ANAF.
 *
 * 1) Date generale firma (denumire, adresa, stare, CAEN, TVA) dupa CUI:
 *    POST https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva
 *
 * 2) Date financiare din bilantul anual (cifra de afaceri, profit, salariati):
 *    GET https://webservicesp.anaf.ro/bilant?an=YYYY&cui=XXXXXXXX
 *
 * Reguli ANAF: maxim 1 request/secunda, maxim 100 CUI-uri per request la /tva.
 * Nu necesita cheie API / cont.
 */

const ANAF_TVA_URL = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva";
const ANAF_BILANT_URL = "https://webservicesp.anaf.ro/bilant";

export interface AnafGeneralData {
  cui: number;
  denumire: string | null;
  nrRegCom: string | null;
  adresa: string | null;
  judetNume: string | null;
  localitateNume: string | null;
  codPostalSediu: string | null;
  telefon: string | null;
  codPostal: string | null;
  stareInregistrare: string | null;
  dataInregistrare: string | null;
  codCaenPrincipal: string | null;
  tvaActiv: boolean | null;
  tvaDataActualizare: string | null;
  radiata: boolean;
  gasita: boolean;
  raspunsBrut: unknown;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Cauta o singura firma dupa CUI folosind serviciul web public ANAF. */
export async function lookupCompanyByCui(
  cui: number
): Promise<AnafGeneralData> {
  const res = await fetch(ANAF_TVA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ cui, data: todayIso() }]),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ANAF a raspuns cu eroare HTTP ${res.status}`);
  }

  const json = await res.json();
  const found = json?.found?.[0];

  if (!found) {
    return {
      cui,
      denumire: null,
      nrRegCom: null,
      adresa: null,
      judetNume: null,
      localitateNume: null,
      codPostalSediu: null,
      telefon: null,
      codPostal: null,
      stareInregistrare: null,
      dataInregistrare: null,
      codCaenPrincipal: null,
      tvaActiv: null,
      tvaDataActualizare: null,
      radiata: false,
      gasita: false,
      raspunsBrut: json,
    };
  }

  const dg = found.date_generale ?? {};
  const tva = found.inregistrare_scop_Tva ?? {};
  const inactiv = found.stare_inactiv ?? {};
  const adresaSocial = found.adresa_sediu_social ?? {};

  // "scpTVA: true" inseamna platitor de TVA activ in acest moment
  const tvaActiv: boolean | null =
    typeof tva.scpTVA === "boolean" ? tva.scpTVA : null;

  const perioade = tva.perioade_TVA ?? [];
  const ultimaPerioada = Array.isArray(perioade) && perioade.length > 0
    ? perioade[perioade.length - 1]
    : null;

  const adresaCompleta =
    dg.adresa ||
    [
      adresaSocial.sdenumire_Strada,
      adresaSocial.snumar_Strada,
      adresaSocial.sdenumire_Localitate,
      adresaSocial.sdenumire_Judet,
    ]
      .filter(Boolean)
      .join(", ") ||
    null;

  return {
    cui: dg.cui ?? cui,
    denumire: dg.denumire ?? null,
    nrRegCom: dg.nrRegCom ?? null,
    adresa: adresaCompleta,
    judetNume: adresaSocial.sdenumire_Judet || null,
    localitateNume: adresaSocial.sdenumire_Localitate || null,
    codPostalSediu: adresaSocial.scod_Postal || null,
    telefon: dg.telefon || null,
    codPostal: dg.codPostal || adresaSocial.scod_Postal || null,
    stareInregistrare: dg.stare_inregistrare ?? null,
    dataInregistrare: dg.data_inregistrare ?? null,
    codCaenPrincipal: dg.cod_CAEN ?? null,
    tvaActiv,
    tvaDataActualizare: ultimaPerioada?.data_inceput_ScpTVA ?? null,
    radiata: Boolean(inactiv?.statusInactivi),
    gasita: true,
    raspunsBrut: json,
  };
}

export interface AnafBilantData {
  an: number;
  cifraAfaceri: number | null;
  profitNet: number | null;
  numarSalariati: number | null;
  gasit: boolean;
}

/**
 * Un singur an de bilant returneaza multe "indicatori" (I1, I2, ...) al caror
 * NUMAR difera dupa tipul de firma (asigurari, banca, firma standard etc).
 * De-asta cautam dupa TEXTUL etichetei ("val_den_indicator"), nu dupa cod.
 */
function extractIndicator(
  indicatori: Array<{ val_den_indicator?: string; val_indicator?: number }>,
  matches: string[]
): number | null {
  const gasit = indicatori.find((i) => {
    const eticheta = (i.val_den_indicator || "").toLowerCase();
    return matches.some((m) => eticheta.includes(m));
  });
  return typeof gasit?.val_indicator === "number" ? gasit.val_indicator : null;
}

/** Incearca sa obtina bilantul pentru cel mai recent an disponibil (an curent -> an-4). */
export async function fetchLatestBilant(
  cui: number,
  fromYear = new Date().getFullYear() - 1
): Promise<AnafBilantData | null> {
  for (let an = fromYear; an >= fromYear - 4; an--) {
    try {
      const res = await fetch(
        `${ANAF_BILANT_URL}?an=${an}&cui=${cui}`,
        { cache: "no-store" }
      );
      if (!res.ok) continue;

      const json = await res.json();
      if (!json || !Array.isArray(json.i) || json.i.length === 0) continue;

      const cifraAfaceri = extractIndicator(json.i, [
        "cifra de afaceri neta",
        "cifra de afaceri",
      ]);
      const profitNet = extractIndicator(json.i, ["profit net"]);
      const pierdereNeta = extractIndicator(json.i, ["pierdere neta"]);
      const numarSalariati = extractIndicator(json.i, [
        "numar mediu de salariati",
        "numar mediu de personal",
      ]);

      return {
        an,
        cifraAfaceri,
        profitNet: profitNet ?? (pierdereNeta ? -pierdereNeta : null),
        numarSalariati,
        gasit: true,
      };
    } catch {
      // incearca anul anterior
      continue;
    }
  }
  return null;
}

/** Mica pauza utila cand se interogheaza ANAF in bucla (limita: 1 request/secunda). */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

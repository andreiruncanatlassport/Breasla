/** Etichete comune pentru atributele firmelor — o singura sursa de adevar,
 *  folosita si la editare, si la filtrare, si la afisare. */

export const TIMP_RASPUNS_OPTIUNI = [
  { id: "sub_1h", scurt: "<1h", lung: "Sub 1 oră" },
  { id: "sub_24h", scurt: "<24h", lung: "Sub 24 de ore" },
  { id: "2_3_zile", scurt: "2-3 zile", lung: "2-3 zile" },
  { id: "peste_3_zile", scurt: "3+ zile", lung: "Peste 3 zile" },
] as const;

export const PROIECT_MARIME_OPTIUNI = [
  { id: "sub_5k", scurt: "<5k €", lung: "Sub 5.000 €" },
  { id: "5k_25k", scurt: "5–25k €", lung: "5.000 – 25.000 €" },
  { id: "25k_100k", scurt: "25–100k €", lung: "25.000 – 100.000 €" },
  { id: "100k_500k", scurt: "100–500k €", lung: "100.000 – 500.000 €" },
  { id: "peste_500k", scurt: ">500k €", lung: "Peste 500.000 €" },
] as const;

export const DIMENSIUNE_ECHIPA_OPTIUNI = [
  { id: "1", lung: "1 (doar eu)" },
  { id: "2-9", lung: "2-9" },
  { id: "10-49", lung: "10-49" },
  { id: "50-249", lung: "50-249" },
  { id: "250+", lung: "250+" },
] as const;

export const SORTARE_OPTIUNI = [
  { id: "relevanta", eticheta: "Relevanță" },
  { id: "rating_desc", eticheta: "Rating (mare → mic)" },
  { id: "recente", eticheta: "Cele mai noi" },
  { id: "vechime_desc", eticheta: "Vechime (firme consacrate)" },
  { id: "nume_asc", eticheta: "Nume (A → Z)" },
] as const;

export type SortareId = (typeof SORTARE_OPTIUNI)[number]["id"];

export function etichetaTimpRaspuns(id: string | null | undefined, lung = false) {
  const o = TIMP_RASPUNS_OPTIUNI.find((x) => x.id === id);
  return o ? (lung ? o.lung : o.scurt) : null;
}

export function etichetaProiectMarime(id: string | null | undefined, lung = false) {
  const o = PROIECT_MARIME_OPTIUNI.find((x) => x.id === id);
  return o ? (lung ? o.lung : o.scurt) : null;
}

/** O firmă e considerată "nouă în Breasla" în primele 30 de zile. */
export function esteFirmaNoua(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const zile = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return zile <= 30;
}

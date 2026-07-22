type ErorSupabase = { code?: string | null; message?: string | null } | null | undefined;

/**
 * Transforma o eroare primita de la Supabase (Postgrest sau Auth) intr-un
 * mesaj SIGUR de aratat userului, fara sa scurgem detalii tehnice (nume de
 * constrangeri, coloane, tabele etc. — ex: "violates check constraint
 * companies_dimensiune_echipa_check"). Eroarea bruta e logata server-side
 * (vizibila in log-urile din Railway) pentru debugging.
 *
 * @param error         eroarea primita de la Supabase
 * @param context       text scurt pentru log, ca sa stii de unde vine (ex: "creare firma")
 * @param mesajePeCod   mapare optionala cod Postgres -> mesaj prietenos, specific rutei
 *                      (ex: { "23505": "Ai lăsat deja o recenzie acestei firme." })
 */
export function mesajEroareSigur(
  error: ErorSupabase,
  context: string,
  mesajePeCod?: Partial<Record<string, string>>
): string {
  if (!error) return "A apărut o eroare neașteptată. Te rugăm încearcă din nou.";

  console.error(`Eroare la ${context}:`, error);

  if (error.code && mesajePeCod?.[error.code]) return mesajePeCod[error.code]!;

  switch (error.code) {
    case "23505":
      return "Această înregistrare există deja.";
    case "23514":
      return "Una dintre valorile completate nu este validă. Verifică formularul și încearcă din nou.";
    case "23503":
      return "Operațiunea face referire la o înregistrare care nu (mai) există.";
    default:
      return "Nu am putut salva. Te rugăm încearcă din nou sau contactează-ne dacă problema persistă.";
  }
}

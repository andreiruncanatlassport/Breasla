/** Elimina diacritice si normalizeaza la lowercase, pentru potriviri "fuzzy" de text. */
export function normalizeazaText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^municipiul\s+/, "")
    .replace(/^judetul\s+/, "")
    .trim();
}

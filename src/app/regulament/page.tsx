import { Card } from "@/components/ui/Card";

const SECTIUNI = [
  {
    titlu: "1. Cine se poate înregistra",
    continut:
      "Orice firmă activă din România, cu CUI valid la ANAF. O firmă (un CUI) poate avea un singur profil pe platformă. Profilurile duplicate sau înregistrate cu date false se suspendă fără avertisment.",
  },
  {
    titlu: "2. Verificare și aprobare",
    continut:
      "Datele oficiale (denumire, adresă, stare de înregistrare) sunt preluate automat de la ANAF. Firmele active sunt publicate automat; cele cu semnale neclare (de ex. status incert la ANAF) intră în verificare manuală de către un administrator.",
  },
  {
    titlu: "3. Date personale",
    continut:
      "Numele și datele de contact personale ale reprezentantului rămân private și sunt vizibile doar firmelor cu care se acceptă o conexiune. Datele firmei (denumire, adresă, contact public) sunt vizibile tuturor, fiind date despre o persoană juridică.",
  },
  {
    titlu: "4. Comportament așteptat",
    continut:
      "Comunicarea între firme trebuie să fie respectuoasă și de bună-credință. Nu sunt permise: spam, oferte comerciale nesolicitate în masă, hărțuire, sau folosirea platformei pentru altceva decât găsirea de colaboratori/subcontractanți de încredere.",
  },
  {
    titlu: "5. Ce se întâmplă dacă încalci regulile",
    continut:
      "În funcție de gravitate: avertisment, suspendarea temporară a profilului, sau eliminarea definitivă. Deciziile sunt luate de administratori și pot fi contestate prin contactarea echipei.",
  },
  {
    titlu: "6. Modificări",
    continut:
      "Acest regulament poate fi actualizat pe măsură ce comunitatea crește. Modificările importante vor fi comunicate membrilor.",
  },
];

export default function RegulamentPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="stamp-label text-seal">Document oficial</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Regulament</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Reguli simple, gândite să țină comunitatea de încredere.
      </p>

      <div className="mt-8 space-y-5">
        {SECTIUNI.map((s) => (
          <Card key={s.titlu} variant="accent">
            <h2 className="font-semibold text-ink">{s.titlu}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.continut}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

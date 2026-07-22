import { Card } from "@/components/ui/Card";
import { TERMENI_VERSIUNE } from "@/lib/terms";

const SECTIUNI = [
  {
    titlu: "1. Acceptarea termenilor",
    continut:
      "Prin crearea unui cont și înregistrarea unei firme pe ACDR, confirmi că ai citit, ai înțeles și ești de acord cu acești Termeni și Condiții, cu Regulamentul comunității și cu Politica de confidențialitate. Dacă nu ești de acord, te rugăm să nu folosești platforma.",
  },
  {
    titlu: "2. Ce este ACDR",
    continut:
      "ACDR este un catalog online de firme din România, verificate prin date publice de la ANAF, conceput pentru a facilita găsirea de colaboratori și subcontractanți. ACDR nu este parte în nicio înțelegere comercială încheiată între firmele de pe platformă și nu garantează calitatea, disponibilitatea sau rezultatul niciunei colaborări.",
  },
  {
    titlu: "3. Cine se poate înregistra",
    continut:
      "Platforma e destinată persoanelor care reprezintă legal o firmă activă, înregistrată în România, cu CUI valid. Prin înregistrare, declari că ai autoritatea de a reprezenta firma respectivă pe platformă.",
  },
  {
    titlu: "4. Contul tău",
    continut:
      "Ești responsabil pentru acuratețea datelor introduse și pentru păstrarea în siguranță a parolei contului. Datele oficiale ale firmei (denumire, adresă, status) sunt preluate automat de la ANAF; datele completate manual (descriere, contact, portofoliu) rămân responsabilitatea ta.",
  },
  {
    titlu: "5. Conduită și conținut",
    continut:
      "Ești de acord să respecți Regulamentul comunității. ACDR își rezervă dreptul de a modera, suspenda sau elimina profiluri, recenzii sau conținut care încalcă regulile platformei sau legislația aplicabilă.",
  },
  {
    titlu: "6. Acuratețea datelor de la ANAF",
    continut:
      "Datele oficiale afișate provin din serviciile publice ale ANAF și reflectă informația disponibilă la momentul preluării. ACDR nu garantează actualizarea în timp real a acestor date și recomandă verificarea independentă înainte de orice decizie comercială importantă.",
  },
  {
    titlu: "7. Recenzii și conexiuni",
    continut:
      "Recenziile sunt publicate doar după verificarea unei dovezi de colaborare și pot fi respinse la discreția administratorilor. Conexiunile dintre firme oferă acces la date de contact suplimentare, dar nu constituie nicio formă de girare sau garanție din partea ACDR.",
  },
  {
    titlu: "8. Proprietate intelectuală",
    continut:
      "Conținutul pe care îl încarci (poze de portofoliu, descrieri, logo) rămâne proprietatea ta; prin încărcare, acorzi platformei dreptul de a-l afișa public în scopul funcționării serviciului. Ești responsabil să deții drepturile asupra a tot ce încarci.",
  },
  {
    titlu: "9. Limitarea răspunderii",
    continut:
      'Platforma e oferită "ca atare", fără garanții privind disponibilitatea neîntreruptă sau absența erorilor. ACDR nu răspunde pentru pagube rezultate din colaborări între firme sau din decizii luate pe baza informațiilor afișate pe platformă.',
  },
  {
    titlu: "10. Suspendarea sau încetarea contului",
    continut:
      "Poți solicita oricând ștergerea contului și a datelor firmei tale. ACDR poate suspenda sau elimina un cont care încalcă acești termeni sau regulamentul, conform procesului descris acolo.",
  },
  {
    titlu: "11. Modificări",
    continut:
      "Acești termeni pot fi actualizați periodic. Modificările importante vor fi comunicate membrilor, iar continuarea folosirii platformei după o actualizare înseamnă acceptarea noii versiuni.",
  },
  {
    titlu: "12. Legea aplicabilă",
    continut:
      "Acești termeni sunt guvernați de legislația română. Orice dispută se va încerca a fi soluționată pe cale amiabilă; în caz contrar, competența revine instanțelor românești.",
  },
];

export default function TermeniPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="stamp-label text-seal">Document oficial</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Termeni și Condiții</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Versiune: {TERMENI_VERSIUNE}. Acesta e un draft de pornire, scris pentru claritate —
        recomandăm o revizuire de către un jurist înainte de lansarea publică la scară largă. Nu
        constituie consultanță juridică.
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

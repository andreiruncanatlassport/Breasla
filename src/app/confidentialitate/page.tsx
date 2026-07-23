import { Card } from "@/components/ui/Card";

export default function ConfidentialitatePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <p className="stamp-label text-seal">Document oficial</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Confidențialitate & date personale</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Rezumat pe scurt al modului în care tratăm datele.
      </p>

      <div className="mt-8 space-y-5">
        <Card variant="accent">
          <h2 className="font-semibold text-ink">Ce date colectăm</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Date despre firmă (preluate oficial de la ANAF pe baza CUI: denumire, adresă, stare de
            înregistrare, cod CAEN, status TVA) și date introduse de tine (contact public, domenii
            de activitate, descriere). Separat, colectăm date personale ale reprezentantului
            (nume, telefon, email personal) doar dacă le introduci la înregistrare.
          </p>
        </Card>
        <Card variant="accent">
          <h2 className="font-semibold text-ink">Ce e public și ce e privat</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Datele firmei sunt publice odată ce profilul e verificat — sunt date despre o persoană
            juridică, nu date cu caracter personal. Datele personale ale reprezentantului sunt
            private și vizibile doar firmelor cu care ai o conexiune acceptată, sau administratorilor
            platformei.
          </p>
        </Card>
        <Card variant="accent">
          <h2 className="font-semibold text-ink">Sursele datelor oficiale</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Datele despre firmă provin din serviciile publice și gratuite ale ANAF
            (webservicesp.anaf.ro). Adresa e folosită și pentru a calcula poziția aproximativă pe
            hartă (geocodare), prin OpenStreetMap Nominatim.
          </p>
        </Card>
        <Card variant="accent">
          <h2 className="font-semibold text-ink">Drepturile tale</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Poți edita sau șterge datele personale oricând din contul tău, sau poți cere ștergerea
            completă a contului contactând un administrator. Datele firmei pot fi actualizate din
            panoul propriu de administrare a profilului.
          </p>
        </Card>
      </div>
    </div>
  );
}

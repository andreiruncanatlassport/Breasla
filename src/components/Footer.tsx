import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-paper-white">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-ink/60">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
          <div>
            <p className="font-display text-base text-ink">Breasla</p>
            <p className="mt-1 max-w-xs">
              Registrul antreprenorilor din România — găsește colaboratori verificați, în orice domeniu.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Link href="/catalog" className="hover:text-ink">Catalog</Link>
            <Link href="/inregistrare" className="hover:text-ink">Înregistrare</Link>
            <Link href="/regulament" className="hover:text-ink">Regulament</Link>
            <Link href="/confidentialitate" className="hover:text-ink">Confidențialitate</Link>
          </div>
        </div>
        <p className="mt-8 text-xs text-ink/40">
          Datele firmelor sunt preluate din surse publice oficiale (ANAF). © {new Date().getFullYear()} Breasla.
        </p>
      </div>
    </footer>
  );
}

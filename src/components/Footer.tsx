import Link from "next/link";
import { BreaslaMark } from "@/components/ui/BreaslaMark";

const LINKURI = [
  { href: "/catalog", label: "Catalog firme" },
  { href: "/inregistrare", label: "Înregistrare" },
  { href: "/termeni", label: "Termeni & Condiții" },
  { href: "/regulament", label: "Regulament" },
  { href: "/confidentialitate", label: "Confidențialitate" },
];

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-gradient-to-br from-navy to-[#0d3a62]">
      <BreaslaMark
        variant="white"
        className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 opacity-[0.05]"
      />
      <div className="relative mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <BreaslaMark variant="white" className="h-7 w-7" />
              <span className="font-display text-lg font-semibold tracking-tight text-white">
                Breasla.ro
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Registrul antreprenorilor din România — găsește colaboratori verificați, în orice
              domeniu.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:flex sm:flex-col">
            {LINKURI.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-white/60 transition-all duration-200 hover:translate-x-0.5 hover:text-seal-light"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            Datele firmelor sunt preluate din surse publice oficiale (ANAF).
          </p>
          <p className="font-mono-num text-xs text-white/40">
            © {new Date().getFullYear()} Breasla.ro
          </p>
        </div>
      </div>
    </footer>
  );
}

import { clsx } from "clsx";

interface VerifiedStampProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { pad: "pl-1 pr-3 py-1", dot: "h-4 w-4", text: "text-[10px]", gap: "gap-1.5", check: "1.6" },
  md: { pad: "pl-1.5 pr-3.5 py-1.5", dot: "h-5 w-5", text: "text-xs", gap: "gap-2", check: "2" },
  lg: { pad: "pl-2 pr-5 py-2.5", dot: "h-8 w-8", text: "text-sm", gap: "gap-2.5", check: "2.2" },
};

/**
 * Insigna de "verificat prin ANAF" — un cerc degrade teal cu bifă, în stilul
 * badge-urilor de status ale platformei (nu un decor separat). Se folosește
 * lângă numele firmei, nu ca stampilă centrală decorativă.
 */
export function VerifiedStamp({ label = "Verificat ANAF", size = "md", className }: VerifiedStampProps) {
  const s = sizeMap[size];
  return (
    <div
      role="img"
      aria-label={label}
      className={clsx(
        "inline-flex items-center rounded-full bg-teal/12 ring-1 ring-inset ring-teal/25",
        "font-mono-num font-bold uppercase tracking-wider text-teal",
        "transition-transform duration-200 hover:-translate-y-0.5",
        s.pad,
        s.gap,
        s.text,
        className
      )}
    >
      <span
        className={clsx("flex shrink-0 items-center justify-center rounded-full", s.dot)}
        style={{ background: "linear-gradient(135deg, var(--color-teal), var(--color-teal-light))" }}
      >
        <svg viewBox="0 0 16 16" className="h-[55%] w-[55%]" fill="none">
          <path
            d="M3.5 8.5l3 3 6-6.5"
            stroke="white"
            strokeWidth={s.check}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label}
    </div>
  );
}

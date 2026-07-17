import { clsx } from "clsx";

interface BreaslaMarkProps {
  className?: string;
  /**
   * "auto"  — implicit: sigla color pe temă deschisă, albă pe temă întunecată.
   * "white" — forțat alb (benzi navy: header, footer, secțiuni dark).
   * "color" — forțat color (rar; doar pe fundaluri garantat deschise).
   */
  variant?: "auto" | "color" | "white";
}

/**
 * Semnul de brand Breasla.ro — sigla oficială.
 *
 * Pe varianta "auto" randăm ambele imagini și comutăm prin CSS (dark:), nu
 * prin JavaScript: astfel sigla e corectă din primul cadru, fără pâlpâire la
 * încărcare și fără nepotrivire între ce randează serverul și clientul.
 */
export function BreaslaMark({ className, variant = "auto" }: BreaslaMarkProps) {
  if (variant === "auto") {
    return (
      <span className={clsx("relative inline-block shrink-0", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt="Breasla.ro"
          className="h-full w-full object-contain dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark-white.png"
          alt=""
          aria-hidden
          className="hidden h-full w-full object-contain dark:block"
        />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "white" ? "/logo-mark-white.png" : "/logo-mark.png"}
      alt="Breasla.ro"
      className={clsx("object-contain", className)}
    />
  );
}

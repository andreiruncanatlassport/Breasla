import { clsx } from "clsx";

interface BreaslaMarkProps {
  className?: string;
  /** "color" pe fundaluri deschise, "white" pe fundaluri navy/dark. */
  variant?: "color" | "white";
}

/**
 * Semnul de brand Breasla.ro — sigla oficială (casă + unelte de meserie
 * într-un cerc), nu o iconiță generică. Folosește variant="white" pe
 * fundaluri navy (header, footer, benzi dark).
 */
export function BreaslaMark({ className, variant = "color" }: BreaslaMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "white" ? "/logo-mark-white.png" : "/logo-mark.png"}
      alt="Breasla.ro"
      className={clsx("object-contain", className)}
    />
  );
}

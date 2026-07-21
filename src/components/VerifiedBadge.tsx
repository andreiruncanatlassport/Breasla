import { BadgeCheck } from "lucide-react";

/**
 * Insigna "Verificat" — apare la membrii cu 5+ recomandari de la alti membri
 * (cu care au schimbat mesaje). Semnal de incredere care iese in evidenta.
 */
export function VerifiedBadge({
  nrRecomandari,
  size = "md",
}: {
  nrRecomandari?: number;
  size?: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textClass = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-teal/12 px-2 py-0.5 font-semibold text-teal ${textClass}`}
      title={nrRecomandari ? `Recomandat de ${nrRecomandari} membri` : "Membru verificat"}
    >
      <BadgeCheck className={iconClass} strokeWidth={2.2} />
      Verificat
    </span>
  );
}

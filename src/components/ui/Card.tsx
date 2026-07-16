import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-line bg-paper-white p-6 shadow-[0_1px_2px_rgba(23,33,59,0.04)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-ink/8 text-ink",
  success: "bg-teal/12 text-teal",
  warning: "bg-seal/15 text-seal",
  danger: "bg-rust/12 text-rust",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

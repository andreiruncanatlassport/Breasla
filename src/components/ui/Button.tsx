import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-content hover:brightness-110 disabled:opacity-40",
  secondary:
    "bg-transparent text-ink border border-ink/25 hover:border-ink hover:bg-ink/5",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-rust text-white hover:brightness-110",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-7 py-3.5 text-base rounded-lg",
};

const shared =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(shared, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: BaseProps & { href: string }) {
  return (
    <Link
      href={href}
      className={clsx(shared, variantClasses[variant], sizeClasses[size], className)}
    >
      {children}
    </Link>
  );
}

import { clsx } from "clsx";
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldBase =
  "w-full rounded-lg border border-line bg-paper-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 outline-none transition-colors focus:border-seal disabled:bg-paper disabled:text-ink/50";

export function Label({
  children,
  required,
  className,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={clsx("mb-1.5 block text-sm font-medium text-ink", className)} {...rest}>
      {children}
      {required && <span className="ml-0.5 text-rust">*</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldBase, props.className)} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(fieldBase, "min-h-[100px] resize-y", props.className)} {...props} />;
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={clsx(fieldBase, "cursor-pointer", props.className)} {...props}>
      {children}
    </select>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-ink/55">{children}</p>;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-rust">{children}</p>;
}

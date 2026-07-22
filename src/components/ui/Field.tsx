import { clsx } from "clsx";
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/* Inputurile arata "scobit" in pagina — se disting clar de blocurile de text,
   care sunt ridicate. Contrast intentionat: text = ridicat, input = adancit. */
const fieldBase = clsx(
  "w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink",
  "shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)]",
  "placeholder:text-ink-soft/60 outline-none",
  "transition-all duration-200",
  "focus:border-seal focus:ring-3 focus:ring-seal/12",
  "disabled:bg-ink/4 disabled:text-ink-soft disabled:cursor-not-allowed"
);

export function Label({
  children,
  required,
  className,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={clsx("mb-1.5 block text-sm font-semibold text-ink", className)}
      {...rest}
    >
      {children}
      {required && <span className="ml-1 text-ember">*</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(fieldBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={clsx(fieldBase, "min-h-[110px] resize-y leading-relaxed", props.className)} />
  );
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={clsx(
        fieldBase,
        "cursor-pointer appearance-none bg-no-repeat pr-9",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22/%3E%3C/svg%3E')]",
        "bg-[position:right_0.75rem_center] bg-[size:1rem]",
        props.className
      )}
    >
      {children}
    </select>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{children}</p>;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-rust">
      <span aria-hidden>⚠</span>
      <span>{children}</span>
    </p>
  );
}

/** Grup de campuri intr-un bloc scobit — pentru sectiuni de formular lungi. */
export function FieldGroup({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("block-inset p-5", className)}>
      {title && <p className="stamp-label mb-3 text-ink-soft">{title}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

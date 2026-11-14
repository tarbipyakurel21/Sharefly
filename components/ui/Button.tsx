import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
const styles: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-line hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
  danger: "bg-bad-soft text-bad hover:bg-[#f2d3cf]",
};
export const btn = (v: Variant = "primary", extra = "") => `${base} ${styles[v]} ${extra}`;

export function Button({ variant = "primary", className = "", loading, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; children: ReactNode }) {
  return (
    <button {...p} disabled={p.disabled || loading} className={btn(variant, className)}>
      {loading ? "One moment…" : children}
    </button>
  );
}
export function LinkButton({ href, variant = "primary", className = "", children }: { href: string; variant?: Variant; className?: string; children: ReactNode }) {
  return <Link href={href} className={btn(variant, className)}>{children}</Link>;
}

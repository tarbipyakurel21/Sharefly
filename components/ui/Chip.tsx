import Link from "next/link";
import type { ReactNode } from "react";

export function Chip({ children, active, onClick, href, tone = "neutral" }: { children: ReactNode; active?: boolean; onClick?: () => void; href?: string; tone?: "neutral" | "good" | "warn" | "bad" | "accent" }) {
  const tones = { neutral: "bg-sunken text-ink", good: "bg-good-soft text-good", warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad", accent: "bg-accent-soft text-accent" };
  const cls = `inline-flex min-h-8 items-center rounded-full px-3 text-sm font-medium transition-colors ${active ? "bg-ink text-white" : tones[tone]} ${onClick || href ? "cursor-pointer hover:brightness-95" : ""}`;
  if (href) return <Link href={href} className={`${cls} min-h-11 sm:min-h-8`} aria-current={active ? "true" : undefined}>{children}</Link>;
  if (onClick) return <button type="button" onClick={onClick} aria-pressed={active} className={`${cls} min-h-11 sm:min-h-8`}>{children}</button>;
  return <span className={cls}>{children}</span>;
}

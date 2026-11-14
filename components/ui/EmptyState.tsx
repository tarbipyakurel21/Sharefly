import type { ReactNode } from "react";

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
      <h3 className="font-display text-xl">{title}</h3>
      {body && <p className="mx-auto mt-2 max-w-md text-muted">{body}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-[var(--radius-card)] border border-line bg-bad-soft/50 px-6 py-8 text-center">
      <p className="text-bad">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-3 min-h-11 rounded-xl bg-surface px-4 font-semibold shadow-[var(--shadow-soft)]">Try again</button>}
    </div>
  );
}
export const Skeleton = ({ className = "" }: { className?: string }) => <div className={`skeleton ${className}`} aria-hidden="true" />;

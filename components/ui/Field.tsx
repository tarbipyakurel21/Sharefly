import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const input = "w-full min-h-11 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-ink placeholder:text-muted/70 transition-colors focus:border-accent";

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string | null; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
    </div>
  );
}
export function TextInput(p: InputHTMLAttributes<HTMLInputElement>) { return <input {...p} className={`${input} ${p.className ?? ""}`} />; }
export function TextArea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...p} className={`${input} ${p.className ?? ""}`} />; }
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...p} className={`${input} ${p.className ?? ""}`} />; }

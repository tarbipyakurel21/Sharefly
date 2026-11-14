"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";

export function SignInForm({ onDone, next }: { onDone?: () => void; next?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api("/api/session", { method: "POST", json: { name, email } });
      router.refresh();
      if (onDone) onDone(); else router.push(next ?? "/browse");
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Your name" htmlFor="si-name"><TextInput id="si-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></Field>
      <Field label="Email" htmlFor="si-email" hint="We only use this to recognise you when you come back."><TextInput id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      <Button type="submit" loading={busy} className="w-full">Continue</Button>
    </form>
  );
}

export function SignInCard({ title = "Sign in to continue", body }: { title?: string; body?: string }) {
  return (
    <div className="mx-auto max-w-md rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-2xl">{title}</h2>
      {body && <p className="mb-4 mt-1 text-muted">{body}</p>}
      <div className="mt-4"><SignInForm onDone={() => {}} /></div>
    </div>
  );
}

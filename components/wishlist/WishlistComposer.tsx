"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { NeighborhoodInput } from "@/components/ui/NeighborhoodInput";

export function WishlistComposer({ initialText = "", defaultNeighborhood = "" }: { initialText?: string; defaultNeighborhood?: string }) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [budget, setBudget] = useState("");
  const [miles, setMiles] = useState("");
  const [nb, setNb] = useState(defaultNeighborhood);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number; understood: boolean } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setResult(null);
    try {
      const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
      const b = num(budget), m = num(miles);
      if ((b !== undefined && Number.isNaN(b)) || (m !== undefined && Number.isNaN(m))) throw new Error("Please enter budget and distance as numbers, like 30 and 5.");
      const r = await api<{ matchCount: number; understood: boolean }>("/api/wishlists", { method: "POST", json: { rawText: text, maxPriceDollars: b ?? null, maxDistanceMiles: m ?? null, neighborhood: nb || null } });
      setResult({ count: r.matchCount, understood: r.understood });
      setText(""); setBudget(""); setMiles("");
      router.refresh();
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
      <Field label="What are you looking for?" htmlFor="wl-text" hint="Try: “A sturdy desk for a small bedroom, under $30, within 5 miles.”">
        <TextArea id="wl-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe it in your own words" maxLength={400} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Budget (optional)" htmlFor="wl-b"><TextInput id="wl-b" inputMode="decimal" placeholder="$ max" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>
        <Field label="Distance in miles (optional)" htmlFor="wl-m"><TextInput id="wl-m" inputMode="decimal" placeholder="e.g. 5" value={miles} onChange={(e) => setMiles(e.target.value)} /></Field>
        <Field label="Your neighborhood" htmlFor="wl-nb"><NeighborhoodInput id="wl-nb" value={nb} onChange={(e) => setNb(e.target.value)} /></Field>
      </div>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      <Button type="submit" loading={busy}>Save wishlist</Button>
      {result && (
        <div role="status" className="rise rounded-xl bg-good-soft p-3 text-good">
          {result.count > 0 ? <>We found {result.count} {result.count === 1 ? "thing" : "things"} you might like. <Link href="/matches" className="font-semibold underline">See your matches</Link></> : "Saved. Nothing matches yet, but we'll let you know when something turns up."}
          {!result.understood && <p className="mt-1 text-sm">We didn't spot a specific kind of item, so we'll watch for your words.</p>}
        </div>
      )}
    </form>
  );
}

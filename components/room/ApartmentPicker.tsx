"use client";
import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/client";
import { bedsLabel, milesFromFeet, rentLabel, sqftLabel } from "@/lib/reference-spaces/format";
import type { ReferenceSpace } from "@/lib/reference-spaces/types";
import type { RoomEstimate } from "@/lib/reference-spaces/estimate";
import { Chip } from "@/components/ui/Chip";
import { Field, Select, TextInput } from "@/components/ui/Field";

export type PickedSpace = ReferenceSpace & { estimate: RoomEstimate | null };

export function ApartmentPicker({ onPick, pickedId }: { onPick: (s: PickedSpace) => void; pickedId: string | null }) {
  const [city, setCity] = useState(""), [beds, setBeds] = useState(""), [maxRent, setMaxRent] = useState(""), [q, setQ] = useState("");
  const [student, setStudent] = useState(false);
  const [results, setResults] = useState<{ spaces: PickedSpace[]; total: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const p = new URLSearchParams({ limit: "12" });
      if (city) p.set("city", city);
      if (beds) p.set("beds", beds);
      if (maxRent && Number(maxRent) > 0) p.set("maxRent", String(Math.round(Number(maxRent))));
      if (q.trim()) p.set("q", q.trim());
      if (student) p.set("nearCollege", "true");
      setBusy(true); setErr(null);
      try { setResults(await api<{ spaces: PickedSpace[]; total: number }>(`/api/reference-spaces?${p}`)); }
      catch (e) { setErr(errMsg(e)); }
      finally { setBusy(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [city, beds, maxRent, q, student]);

  return (
    <section aria-label="Start from a real apartment" className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div>
        <h2 className="font-display text-xl">Start from a real apartment</h2>
        <p className="text-sm text-muted">Pick a real floor plan in Houston or Los Angeles, or Rabinowitz Hall in Princeton and plan free furniture into it. Data: CoStar.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="City" htmlFor="ap-city"><Select id="ap-city" value={city} onChange={(e) => setCity(e.target.value)}><option value="">Any</option><option value="Houston">Houston</option><option value="Los Angeles">Los Angeles</option><option value="Princeton">Princeton</option></Select></Field>
        <Field label="Bedrooms" htmlFor="ap-beds"><Select id="ap-beds" value={beds} onChange={(e) => setBeds(e.target.value)}><option value="">Any</option><option value="0">Studio</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></Select></Field>
        <Field label="Max rent ($/mo)" htmlFor="ap-rent"><TextInput id="ap-rent" value={maxRent} onChange={(e) => setMaxRent(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="1500" /></Field>
        <Field label="Name or college" htmlFor="ap-q"><TextInput id="ap-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="USC, Rice…" maxLength={60} /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={student} onClick={() => setStudent((v) => !v)}>Near a college (move-in / move-out)</Chip>
        {maxRent && <span className="text-sm text-muted">Spaces without a listed rent are hidden while a max rent is set.</span>}
      </div>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      {results && (
        <div aria-busy={busy}>
          <p className="mb-2 text-sm text-muted" data-testid="ap-count">{results.total === 0 ? "No floor plans match. Try loosening a filter." : `${results.total.toLocaleString("en-US")} floor plans${results.total > results.spaces.length ? `, showing ${results.spaces.length}` : ""}`}</p>
          <ul className="grid gap-2 sm:grid-cols-2" data-testid="ap-results">
            {results.spaces.map((s) => {
              const c = s.colleges[0];
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => onPick(s)} aria-pressed={pickedId === s.id}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${pickedId === s.id ? "border-accent bg-accent-soft" : "border-line hover:bg-sunken"}`}>
                    <span className="block font-semibold">{s.communityName ?? "Community name not provided"}</span>
                    <span className="block text-sm text-muted">{s.floorPlanName ? `${s.floorPlanName} · ` : ""}{bedsLabel(s.beds)}{s.baths != null ? ` · ${s.baths} bath` : ""} · {sqftLabel(s)}</span>
                    <span className="block text-sm text-muted">{s.city}, {s.state} · {rentLabel(s)}</span>
                    {c && <span className="block text-sm text-muted">{c.feetToCampus != null ? `${milesFromFeet(c.feetToCampus)} mi from ` : "Near "}{c.name}</span>}
                    {s.lifestyle === "student" && <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 text-xs font-medium text-accent">Student housing</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

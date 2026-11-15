"use client";
import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/client";
import { bedsLabel, milesFromFeet, rentLabel, sqftLabel } from "@/lib/reference-spaces/format";
import type { ReferenceSpace } from "@/lib/reference-spaces/types";
import type { RoomEstimate } from "@/lib/reference-spaces/estimate";
import { Chip } from "@/components/ui/Chip";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { tourCandidates } from "@/lib/matterport/tour";
import { StreetMap } from "./StreetMap";

export type PickedSpace = ReferenceSpace & { estimate: RoomEstimate | null; selectedUnitNumber?: string | null };

export function ApartmentPicker({ onPick, pickedId }: { onPick: (s: PickedSpace) => void; pickedId: string | null }) {
  const [city, setCity] = useState(""), [beds, setBeds] = useState(""), [maxRent, setMaxRent] = useState(""), [q, setQ] = useState("");
  const [student, setStudent] = useState(false);
  const [mapMode, setMapMode] = useState(true);
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
      try { const r = await api<{ spaces: PickedSpace[]; total: number }>(`/api/reference-spaces?${p}`); setResults({ ...r, spaces: r.spaces.filter((s) => tourCandidates(s.matterport).length > 0) }); }
      catch (e) { setErr(errMsg(e)); }
      finally { setBusy(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [city, beds, maxRent, q, student]);

  return (
    <section aria-label="Start from a real apartment" className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div>
        <h2 className="font-display text-xl">Pick a 3D room</h2>
        <p className="text-sm text-muted">Only apartments with a Matterport 3D tour are shown. Data: CoStar.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="City" htmlFor="ap-city"><Select id="ap-city" value={city} onChange={(e) => setCity(e.target.value)}><option value="">Any</option><option value="Houston">Houston</option><option value="Los Angeles">Los Angeles</option><option value="Princeton">Princeton</option></Select></Field>
        <Field label="Bedrooms" htmlFor="ap-beds"><Select id="ap-beds" value={beds} onChange={(e) => setBeds(e.target.value)}><option value="">Any</option><option value="0">Studio</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></Select></Field>
        <Field label="Max rent ($/mo)" htmlFor="ap-rent"><TextInput id="ap-rent" value={maxRent} onChange={(e) => setMaxRent(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="1500" /></Field>
        <Field label="Name or college" htmlFor="ap-q"><TextInput id="ap-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="USC, Rice…" maxLength={60} /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={student} onClick={() => setStudent((v) => !v)}>Near a college (move-in / move-out)</Chip>
        <Chip active={mapMode} onClick={() => setMapMode((v) => !v)}>Map view</Chip>
        {maxRent && <span className="text-sm text-muted">Spaces without a listed rent are hidden while a max rent is set.</span>}
      </div>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      {results && (
        <div aria-busy={busy}>
          <p className="mb-2 text-sm text-muted" data-testid="ap-count">{results.total === 0 ? "No floor plans match. Try loosening a filter." : `${results.total.toLocaleString("en-US")} floor plans${results.total > results.spaces.length ? `, showing ${results.spaces.length}` : ""}`}</p>
          {mapMode && <div className="relative mb-3 overflow-hidden rounded-2xl border border-line bg-[#eaf1ed]" aria-label="Apartment map">
            <StreetMap spaces={results.spaces} pickedId={pickedId} onPick={onPick} />
            <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Apartment map</p>
              <p className="text-sm font-semibold text-ink">{city || "Houston · Los Angeles"}</p>
              <p className="text-xs text-muted">Coordinates from the apartment dataset</p>
            </div>
            {results.spaces.every((s) => s.lat == null || s.lng == null) && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted">Demo map preview. Exact location is not provided for this apartment record; choose it from the demo card below.</div>}
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-white/90 px-3 py-2 text-xs text-muted shadow-sm">Select a pin to preview its 3D tour</div>
          </div>}
          {!mapMode && <ul className="grid gap-2 sm:grid-cols-2" data-testid="ap-results">
            {results.spaces.map((s) => {
              const c = s.colleges[0];
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => onPick(s)} aria-pressed={pickedId === s.id}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${pickedId === s.id ? "border-accent bg-accent-soft" : "border-line hover:bg-sunken"}`}>
                    <span className="block font-semibold">{s.communityName ?? "Community name not provided"}</span>
                    <span className="block text-sm text-muted">{s.floorPlanName ? `${s.floorPlanName} · ` : ""}{bedsLabel(s.beds)}{s.baths != null ? ` · ${s.baths} bath` : ""} · {sqftLabel(s)}</span>
                    <span className="block text-sm text-muted">{s.city}, {s.state} · {rentLabel(s)}</span>
                    {s.units.length > 0 && <span className="block text-sm text-muted">{s.units.length} unit number{s.units.length === 1 ? "" : "s"} available{ s.units.some((u) => u.matterport.length > 0) ? " · some with exact 3D tours" : ""}</span>}
                    {s.units.length > 0 && <label className="mt-2 block text-sm" onClick={(e) => e.stopPropagation()}>
                      <span className="mr-2 text-muted">Apartment number</span>
                      <select className="rounded border border-line bg-surface px-2 py-1" defaultValue="" onChange={(e) => {
                        const u = s.units.find((x) => x.number === e.target.value);
                        onPick(u ? { ...s, selectedUnitNumber: u.number, matterport: { ...s.matterport, unit: u.matterport } } : { ...s, selectedUnitNumber: null });
                      }}>
                        <option value="">Choose a unit (optional)</option>
                        {s.units.map((u) => <option key={u.number} value={u.number}>{u.number}{u.matterport.length ? " · 3D scan" : ""}</option>)}
                      </select>
                    </label>}
                    {c && <span className="block text-sm text-muted">{c.feetToCampus != null ? `${milesFromFeet(c.feetToCampus)} mi from ` : "Near "}{c.name}</span>}
                    {s.lifestyle === "student" && <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 text-xs font-medium text-accent">Student housing</span>}
                  </button>
                </li>
              );
            })}
          </ul>}
        </div>
      )}
    </section>
  );
}

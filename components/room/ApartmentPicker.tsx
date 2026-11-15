"use client";
import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/client";
import { bedsLabel, milesFromFeet, rentLabel, sqftLabel } from "@/lib/reference-spaces/format";
import type { ReferenceSpace } from "@/lib/reference-spaces/types";
import type { RoomEstimate } from "@/lib/reference-spaces/estimate";
import { Chip } from "@/components/ui/Chip";
import { tourCandidates } from "@/lib/matterport/tour";
import { StreetMap } from "./StreetMap";

export type PickedSpace = ReferenceSpace & { estimate: RoomEstimate | null; selectedUnitNumber?: string | null };

const NEAR_KM = 40;

export function ApartmentPicker({ onPick, pickedId }: { onPick: (s: PickedSpace) => void; pickedId: string | null }) {
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [student, setStudent] = useState(false);
  const [mapMode, setMapMode] = useState(true);
  const [results, setResults] = useState<{ spaces: PickedSpace[]; total: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const p = new URLSearchParams({ limit: "12" });
      if (loc) { p.set("lat", String(loc.lat)); p.set("lng", String(loc.lng)); p.set("radiusKm", String(NEAR_KM)); }
      if (student) p.set("nearCollege", "true");
      setBusy(true); setErr(null);
      try { const r = await api<{ spaces: PickedSpace[]; total: number }>(`/api/reference-spaces?${p}`); const near = (s: PickedSpace) => (loc && s.lat != null && s.lng != null ? (s.lat - loc.lat) ** 2 + (s.lng - loc.lng) ** 2 : 0);
        const spaces = r.spaces.filter((s) => tourCandidates(s.matterport).length > 0);
        setResults({ ...r, spaces: loc ? [...spaces].sort((a, b) => near(a) - near(b)) : spaces }); }
      catch (e) { setErr(errMsg(e)); }
      finally { setBusy(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [loc, student]);

  /** Asks the browser for the person's position. It only narrows this search: rounded to about 1 km, never stored or sent anywhere else. */
  function toggleLocation() {
    if (loc) { setLoc(null); setLocMsg(null); return; }
    if (!("geolocation" in navigator)) { setLocMsg("Your browser can't share its location."); return; }
    setLocBusy(true); setLocMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoc({ lat: Math.round(pos.coords.latitude * 100) / 100, lng: Math.round(pos.coords.longitude * 100) / 100 }); setLocBusy(false); },
      (e) => { setLocBusy(false); setLocMsg(e.code === e.PERMISSION_DENIED ? "Location is turned off for this site. You can allow it in your browser settings." : "We couldn't get your location. Please try again."); },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <section aria-label="Start from a real apartment" className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div>
        <h2 className="font-display text-xl">Pick a 3D room</h2>
        <p className="text-sm text-muted">Only apartments with a Matterport 3D tour are shown. Data: CoStar.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={!!loc} onClick={toggleLocation}>{locBusy ? "Finding you…" : loc ? "Near me (on)" : "Share my location"}</Chip>
        <Chip active={student} onClick={() => setStudent((v) => !v)}>Near a college (move-in / move-out)</Chip>
        <Chip active={mapMode} onClick={() => setMapMode((v) => !v)}>Map view</Chip>
      </div>
      {locMsg && <p role="status" className="text-sm text-muted">{locMsg}</p>}
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      {results && (
        <div aria-busy={busy}>
          <p className="mb-2 text-sm text-muted" data-testid="ap-count">{results.total === 0 ? (loc ? `No 3D apartments within ${NEAR_KM} km of you. We only have Houston and Los Angeles.` : "No floor plans match.") : `${results.total.toLocaleString("en-US")} floor plans${results.total > results.spaces.length ? `, showing ${results.spaces.length}` : ""}`}</p>
          {mapMode && <div className="relative mb-3 overflow-hidden rounded-2xl border border-line bg-[#eaf1ed]" aria-label="Apartment map">
            <StreetMap spaces={results.spaces} pickedId={pickedId} onPick={onPick} />
            <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Apartment map</p>
              <p className="text-sm font-semibold text-ink">{loc ? "Near you" : "Houston · Los Angeles"}</p>
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

"use client";
import { useEffect, useState } from "react";
import { embedUrl, LEVEL_LABEL, tourCandidates, type MatterportIdSet } from "@/lib/matterport/tour";

const LOAD_TIMEOUT_MS = 12000;

/**
 * 3D tour of the space. The iframe is created only after the person asks for it (and is `loading="lazy"`),
 * so the page costs nothing until then. Candidates are ordered unit, floor plan, community.
 * Fallbacks: no model id -> short note; load not confirmed in 12 s -> link that opens the tour in a new tab.
 */
export function TourPanel({ matterport, title }: { matterport: MatterportIdSet; title: string }) {
  const cands = tourCandidates(matterport);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const current = cands[i];

  useEffect(() => {
    if (!open || loaded) return;
    setSlow(false);
    const t = setTimeout(() => setSlow(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [open, loaded, i]);

  if (!current) {
    return <p data-testid="tour-none" className="rounded-xl bg-sunken p-3 text-sm text-muted">No 3D tour is available for this space.</p>;
  }
  const url = embedUrl(current.modelId);
  const go = (n: number) => { setI(n); setLoaded(false); };
  return (
    <section aria-label="3D tour" data-testid="tour-panel" className="space-y-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg">3D tour</h2>
        <span data-testid="tour-level" className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">{LEVEL_LABEL[current.level]}</span>
      </div>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="w-full rounded-xl border border-line bg-sunken p-6 text-sm font-medium hover:bg-line/40">
          Load the 3D tour of {title}
        </button>
      ) : (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-sunken">
          <iframe
            key={current.modelId} data-testid="tour-frame" src={url} title={`3D tour of ${title}`} loading="lazy" allowFullScreen
            allow="fullscreen; xr-spatial-tracking" referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)} className="absolute inset-0 h-full w-full border-0"
          />
          {!loaded && <p className="absolute inset-x-0 bottom-0 bg-surface/90 p-2 text-center text-xs text-muted">Loading tour…</p>}
        </div>
      )}
      {open && slow && !loaded && (
        <p role="status" data-testid="tour-slow" className="text-sm text-muted">
          The tour is slow to load. <a className="underline" href={url} target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.
        </p>
      )}
      {cands.length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm" role="group" aria-label="Other tours for this space">
          {cands.map((c, n) => (
            <button key={c.modelId} type="button" aria-pressed={n === i} onClick={() => go(n)}
              className={`rounded-full border px-3 py-1 ${n === i ? "border-accent bg-accent-soft" : "border-line hover:bg-sunken"}`}>
              {LEVEL_LABEL[c.level].split(" (")[0]}{cands.filter((x) => x.level === c.level).length > 1 ? ` ${cands.filter((x) => x.level === c.level).indexOf(c) + 1}` : ""}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">Tour: Matterport. Community and floor-plan tours may show a different unit than yours.</p>
    </section>
  );
}

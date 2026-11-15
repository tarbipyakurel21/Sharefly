"use client";
import { useEffect, useRef, useState } from "react";
import { embedUrl, LEVEL_LABEL, tourCandidates, type MatterportIdSet } from "@/lib/matterport/tour";

const LOAD_TIMEOUT_MS = 12000;
const SDK_URL = "https://static.matterport.com/showcase-sdk/bootstrap/3.1.0-0-g1cd7e0997a/sdk.js";
const OVERLAY_PALETTE = ["Bed", "Desk", "Chair", "Sofa", "Table", "Rug"] as const;
type OverlayPiece = { id: string; label: string; x: number; y: number; rotation: number };

type MatterportSdk = { Model?: { getData?: () => Promise<{ sid?: string }> } };
type MatterportWindow = Window & { MP_SDK?: { connect: (iframe: HTMLIFrameElement, applicationKey?: string) => Promise<MatterportSdk> } };

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
  const [sdkState, setSdkState] = useState<"off" | "connecting" | "connected" | "unavailable">("off");
  const [sdkModelId, setSdkModelId] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayPiece[]>([]);
  const [overlayMode, setOverlayMode] = useState(false);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const current = cands[i];

  useEffect(() => {
    if (!open || loaded) return;
    setSlow(false);
    const t = setTimeout(() => setSlow(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [open, loaded, i]);

  useEffect(() => {
    if (!open || !loaded || !frame.current) return;
    const key = process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY;
    if (!key) { setSdkState("unavailable"); return; }
    let cancelled = false;
    setSdkState("connecting");
    const connect = async () => {
      try {
        if (!(window as MatterportWindow).MP_SDK) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-matterport-sdk="true"]');
            if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("SDK failed")), { once: true }); return; }
            const script = document.createElement("script");
            script.src = `${SDK_URL}?applicationKey=${encodeURIComponent(key)}`;
            script.dataset.matterportSdk = "true";
            script.onload = () => resolve(); script.onerror = () => reject(new Error("SDK failed"));
            document.head.appendChild(script);
          });
        }
        const sdk = await (window as MatterportWindow).MP_SDK!.connect(frame.current!, key);
        const data = await sdk.Model?.getData?.();
        if (!cancelled) { setSdkState("connected"); setSdkModelId(data?.sid ?? current.modelId); }
      } catch { if (!cancelled) setSdkState("unavailable"); }
    };
    void connect();
    return () => { cancelled = true; };
  }, [open, loaded, current.modelId]);

  useEffect(() => {
    function move(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      const host = document.querySelector<HTMLElement>("[data-tour-stage]");
      if (!host) return;
      const r = host.getBoundingClientRect();
      setOverlay((items) => items.map((p) => p.id === d.id ? { ...p, x: Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100 - d.dx)), y: Math.max(8, Math.min(92, ((e.clientY - r.top) / r.height) * 100 - d.dy)) } : p));
    }
    const up = () => { drag.current = null; };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  function addOverlay(label: string) {
    setOverlay((items) => [...items, { id: crypto.randomUUID(), label, x: 50, y: 52, rotation: 0 }]);
    setOverlayMode(true);
  }

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
          <div className="relative aspect-video overflow-hidden rounded-xl bg-sunken" data-tour-stage>
          <iframe
            key={current.modelId} ref={frame} data-testid="tour-frame" src={`${url}${process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY ? `&applicationKey=${encodeURIComponent(process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY)}` : ""}`} title={`3D tour of ${title}`} loading="lazy" allowFullScreen
            allow="fullscreen; xr-spatial-tracking" referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)} className="absolute inset-0 h-full w-full border-0"
          />
          {overlayMode && <div className="pointer-events-none absolute inset-0 z-10">
            {overlay.map((p) => <div key={p.id} className="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 touch-none select-none items-center gap-1 rounded-lg border-2 border-accent bg-white/90 px-2 py-1 text-xs font-semibold shadow-lg" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) rotate(${p.rotation}deg)` }} onPointerDown={(e) => { e.preventDefault(); const r = (e.currentTarget.parentElement?.parentElement as HTMLElement).getBoundingClientRect(); drag.current = { id: p.id, dx: ((e.clientX - r.left) / r.width) * 100 - p.x, dy: ((e.clientY - r.top) / r.height) * 100 - p.y }; }}>
              <span>{p.label}</span><button type="button" aria-label={`Rotate ${p.label}`} className="rounded px-1 hover:bg-line" onClick={() => setOverlay((items) => items.map((x) => x.id === p.id ? { ...x, rotation: x.rotation + 15 } : x))}>↻</button><button type="button" aria-label={`Remove ${p.label}`} className="rounded px-1 hover:bg-line" onClick={() => setOverlay((items) => items.filter((x) => x.id !== p.id))}>×</button>
            </div>)}
          </div>}
          {!loaded && <p className="absolute inset-x-0 bottom-0 bg-surface/90 p-2 text-center text-xs text-muted">Loading tour…</p>}
        </div>
      )}
      {open && (
        <div className="rounded-xl bg-accent-soft p-3 text-sm" data-testid="matterport-status">
          <p className="font-semibold">Matterport space connected</p>
          <p className="mt-1 text-muted">
            {sdkState === "connected" ? `SDK metadata is available for model ${sdkModelId ?? current.modelId}. This tour is the apartment reference; ShareFly stages furniture in its editable planner after you create the room.`
              : sdkState === "connecting" ? "Connecting to the Matterport SDK…"
              : "Tour is available. Add NEXT_PUBLIC_MATTERPORT_SDK_KEY to enable SDK metadata."}
          </p>
          <a href="#room-planner" className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-accent px-3 py-2 font-semibold text-white hover:opacity-90">
            Stage furniture in ShareFly
          </a>
          <div className="mt-3 border-t border-accent/20 pt-3" data-testid="tour-overlay-controls">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setOverlayMode((v) => !v)} className="rounded-lg border border-accent px-3 py-2 text-xs font-semibold">{overlayMode ? "Hide visual staging" : "Try visual staging"}</button>
              {overlayMode && OVERLAY_PALETTE.map((label) => <button key={label} type="button" onClick={() => addOverlay(label)} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs hover:bg-line/40">+ {label}</button>)}
            </div>
            {overlayMode && <p className="mt-2 text-xs text-muted">Approximate 2D overlay only. Drag, rotate, or remove pieces; camera movement in the tour can change alignment. For saved, dimension-aware placement use the ShareFly planner.</p>}
          </div>
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
      <p className="text-xs text-muted">Tour: Matterport. This iframe is a view-only apartment reference; browser security prevents ShareFly from inserting objects into it. Use the ShareFly planner below to place, move, and rotate furniture against the same room dimensions. Community and floor-plan tours may show a different unit than yours.</p>
    </section>
  );
}

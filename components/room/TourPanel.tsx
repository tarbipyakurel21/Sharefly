"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { embedUrl, LEVEL_LABEL, tourCandidates, type MatterportIdSet } from "@/lib/matterport/tour";

const LOAD_TIMEOUT_MS = 12000;
const SDK_URL = "https://static.matterport.com/showcase-sdk/bootstrap/3.1.0-0-g1cd7e0997a/sdk.js";

type MatterportSdk = { Model?: { getData?: () => Promise<{ sid?: string }> } };
type MatterportWindow = Window & { MP_SDK?: { connect: (iframe: HTMLIFrameElement, applicationKey?: string) => Promise<MatterportSdk> } };

/**
 * 3D tour of the space. The iframe is created only after the person asks for it (and is `loading="lazy"`),
 * so the page costs nothing until then. Candidates are ordered unit, floor plan, community.
 * Fallbacks: no model id -> short note; load not confirmed in 12 s -> link that opens the tour in a new tab.
 */
export function TourPanel({ matterport, title, stageHref = "#room-view", stageLabel = "Stage furniture in ShareFly" }: { matterport: MatterportIdSet; title: string; stageHref?: string; stageLabel?: string }) {
  const cands = tourCandidates(matterport);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [sdkState, setSdkState] = useState<"off" | "connecting" | "connected" | "unavailable">("off");
  const [sdkModelId, setSdkModelId] = useState<string | null>(null);
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


  if (!current) {
    return <p data-testid="tour-none" className="rounded-xl bg-sunken p-3 text-sm text-muted">No 3D tour is available for this space.</p>;
  }
  const url = embedUrl(current.modelId);
  const go = (n: number) => { setI(n); setLoaded(false); };
  return (
    <section aria-label="3D tour" data-testid="tour-panel" className="space-y-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
      <span data-testid="tour-level" className="sr-only">{LEVEL_LABEL[current.level]}</span>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full flex-col items-center gap-2 rounded-xl border border-line bg-sunken p-6 text-sm font-medium hover:bg-line/40">
          <Image src="/brand/helping-hands.svg" alt="" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />
          Load 3D tour
        </button>
      ) : (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-sunken" data-tour-stage>
          <iframe
            key={current.modelId} ref={frame} data-testid="tour-frame" src={`${url}${process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY ? `&applicationKey=${encodeURIComponent(process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY)}` : ""}`} title={`3D tour of ${title}`} loading="lazy" allowFullScreen
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
    </section>
  );
}

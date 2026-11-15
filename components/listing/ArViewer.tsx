"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { Category } from "@/lib/categories";
import { buildFurniture, disposeFurniture } from "@/lib/room/model";
import { formatLength, type Unit } from "@/lib/units";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * "View in your room": a to-scale stand-in model the person can place on their real floor through the phone camera.
 * Uses Google's <model-viewer> (Apache-2.0), loaded as its prebuilt bundle because its npm package pins an older three.js.
 * Android Chrome uses WebXR; iPhone/iPad Safari uses AR Quick Look (model-viewer converts the GLB to USDZ on the device).
 */
const PhotoPlacer = dynamic(() => import("./PhotoPlacer"), { ssr: false, loading: () => <p className="flex h-full items-center justify-center text-muted">One moment…</p> });

export const MODEL_VIEWER_SRC = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.4.0/dist/model-viewer.min.js";

type ModelViewerEl = HTMLElement & {
  canActivateAR?: boolean; activateAR?: () => Promise<void>;
  cameraOrbit?: string; fieldOfView?: string; zoom?: (keyPresses: number) => void;
};

/** Starting view: a three-quarter angle from slightly above, the way furniture is usually photographed. */
const HOME_ORBIT = "-32deg 72deg 105%";
// <model-viewer> ignores a camera value identical to the last one it was given, so "reset" alternates two equivalent ones.
const HOME_ORBIT_ALT = "-32.01deg 72deg 105%";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

let loader: Promise<void> | null = null;
function loadModelViewer(): Promise<void> {
  if (customElements.get("model-viewer")) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module"; s.src = MODEL_VIEWER_SRC;
    s.onerror = () => { loader = null; s.remove(); reject(new Error("load")); };
    document.head.appendChild(s);
    customElements.whenDefined("model-viewer").then(() => resolve());
  });
  return loader;
}

async function makeGlb(category: Category, w: number, d: number, h: number): Promise<Blob> {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const scene = new THREE.Scene();
  const obj = buildFurniture(category, w, d, h);
  scene.add(obj);
  try {
    const out = await new GLTFExporter().parseAsync(scene, { binary: true });
    return new Blob([out as ArrayBuffer], { type: "model/gltf-binary" });
  } finally { disposeFurniture(obj); }
}

type Props = { title: string; category: Category; widthM: number | null; depthM: number | null; heightM: number | null; unit: Unit };

export function ArViewer({ title, category, widthM, depthM, heightM, unit }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"3d" | "photo">("3d");
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [arFailed, setArFailed] = useState(false);
  const mv = useRef<ModelViewerEl | null>(null);
  const homeFlip = useRef(false);
  const [touched, setTouched] = useState(false);

  const zoom = (steps: number) => { mv.current?.zoom?.(steps); setTouched(true); };
  const resetView = () => {
    const el = mv.current;
    if (!el) return;
    homeFlip.current = !homeFlip.current;
    el.fieldOfView = homeFlip.current ? "30.01deg" : "30deg";
    el.cameraOrbit = homeFlip.current ? HOME_ORBIT_ALT : HOME_ORBIT;
  };
  const hasSize = widthM != null && depthM != null && heightM != null;

  const start = useCallback(async () => {
    if (!hasSize) return;
    setOpen(true); setArFailed(false);
    if (src) return;
    setState("loading");
    try {
      const [blob] = await Promise.all([makeGlb(category, widthM!, depthM!, heightM!), loadModelViewer()]);
      setSrc(URL.createObjectURL(blob));
      setState("ready");
    } catch { setState("error"); }
  }, [hasSize, src, category, widthM, depthM, heightM]);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  useEffect(() => {
    const el = mv.current;
    if (!el || !src) return;
    const onLoad = () => setArSupported(!!el.canActivateAR);
    const onAr = (e: Event) => { if ((e as CustomEvent<{ status: string }>).detail?.status === "failed") setArFailed(true); };
    const onCam = (e: Event) => { if ((e as CustomEvent<{ source: string }>).detail?.source === "user-interaction") setTouched(true); };
    el.addEventListener("load", onLoad); el.addEventListener("ar-status", onAr); el.addEventListener("camera-change", onCam);
    return () => { el.removeEventListener("load", onLoad); el.removeEventListener("ar-status", onAr); el.removeEventListener("camera-change", onCam); };
  }, [src, open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // the page behind shouldn't scroll while the preview is open
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  if (!hasSize) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-3 text-sm text-muted" data-testid="ar-unavailable">
        <p className="flex items-center gap-2 font-medium text-ink"><Icon name="room" size={18} /> View in your room</p>
        <p className="mt-1">Needs the giver's measurements first, so we can show it at its real size.</p>
      </div>
    );
  }

  const size = `${formatLength(widthM!, unit)} wide × ${formatLength(depthM!, unit)} deep × ${formatLength(heightM!, unit)} tall`;
  return (
    <>
      <Button variant="secondary" className="w-full" onClick={start} data-testid="ar-open"><Icon name="room" size={18} /> View in your room</Button>
      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="ar-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setOpen(false)}>
          <div className="rise flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-y-auto rounded-t-3xl bg-surface shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 p-4 pb-2 sm:px-6 sm:pt-5">
              <div className="min-w-0">
                <h2 id="ar-title" className="truncate font-display text-xl font-semibold sm:text-2xl">{title}</h2>
                <p className="text-sm text-muted">{size} · from the giver</p>
              </div>
              <button type="button" aria-label="Close" className="rounded-full p-2 hover:bg-sunken" onClick={() => setOpen(false)}><Icon name="x" /></button>
            </div>

            <div role="tablist" aria-label="How to preview" className="mx-4 mb-3 grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1 text-sm font-semibold sm:mx-6 sm:max-w-md">
              {([["3d", "3D and phone AR"], ["photo", "In a photo of my room"]] as const).map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
                  className={`min-h-10 rounded-lg px-3 py-2 transition-colors ${mode === k ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}>{label}</button>
              ))}
            </div>

            {mode === "photo" ? (
              <div className="bg-sunken" data-testid="photo-stage">
                <PhotoPlacer title={title} category={category} widthM={widthM!} depthM={depthM!} heightM={heightM!} unit={unit} />
              </div>
            ) : <>
            <div className="relative h-[56dvh] min-h-80 overflow-hidden sm:h-[62dvh]" data-testid="ar-stage" data-state={state}
              style={{ background: "radial-gradient(120% 90% at 50% 35%, #ffffff 0%, var(--color-sunken) 55%, #e4dccf 100%)" }}>
              {state === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
                  <span className="skeleton h-24 w-40" aria-hidden="true" />
                  <p>Building a to-scale model…</p>
                </div>
              )}
              {state === "error" && <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center text-bad">We couldn't load the 3D viewer. Check your connection and try again.</p>}
              {state === "ready" && src && (
                <>
                  <model-viewer ref={mv} src={src} alt={`To-scale model of ${title}`} ar="" ar-modes="webxr quick-look" ar-scale="fixed" ar-placement="floor"
                    camera-controls="" disable-pan="" touch-action="pan-y" interaction-prompt="none"
                    camera-orbit={HOME_ORBIT} min-camera-orbit="auto 20deg 60%" max-camera-orbit="auto 88deg 220%" field-of-view="30deg" interpolation-decay="90"
                    environment-image="neutral" tone-mapping="neutral" exposure="1.05" shadow-intensity="1.15" shadow-softness="0.85"
                    style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}>
                    <button slot="ar-button" type="button" className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-5 py-3 font-semibold text-white shadow-lg">
                      Place it in my room
                    </button>
                  </model-viewer>

                  <p className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur sm:left-4 sm:top-4" data-testid="ar-scale-chip">
                    <Icon name="check" size={14} className="text-good" /> True to size
                  </p>

                  <div role="toolbar" aria-label="3D view controls" data-testid="ar-controls"
                    className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/90 shadow-md backdrop-blur sm:right-4 sm:top-4">
                    {([["Zoom in", "plus", () => zoom(2)], ["Zoom out", "minus", () => zoom(-2)], ["Reset view", "rotate", resetView]] as const).map(([label, icon, run], i) => (
                      <button key={label} type="button" aria-label={label} title={label} onClick={run}
                        className={`flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-sunken active:bg-line ${i ? "border-t border-line" : ""}`}>
                        <Icon name={icon} size={18} />
                      </button>
                    ))}
                  </div>

                  {!touched && (
                    <p className="pointer-events-none absolute bottom-4 left-3 hidden rounded-full bg-ink/75 px-3 py-1.5 text-xs font-medium text-white sm:block" data-testid="ar-hint">
                      Drag to rotate · scroll to zoom
                    </p>
                  )}
                  {!touched && (
                    <p className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/75 px-3 py-1.5 text-xs font-medium text-white sm:hidden">
                      Drag to rotate · pinch to zoom
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2 p-4 text-sm sm:px-6 sm:pb-5">
              {state === "ready" && arSupported === false && (
                <p className="rounded-xl bg-sunken p-3" data-testid="ar-phone-hint"><strong>On a laptop?</strong> <button type="button" className="font-semibold text-accent underline" onClick={() => setMode("photo")}>Try it in a photo of your room</button>, or open this page on your phone to place it on your floor through the camera.</p>
              )}
              {arSupported && !arFailed && <p>Tap <strong>Place it in my room</strong>, then point your camera at the floor and move the phone slowly until it finds the floor. Drag to move it, twist with two fingers to turn it.</p>}
              {arFailed && <p role="alert" className="text-bad">Your phone couldn't start AR. Try more light, or a floor with some texture.</p>}
              <p className="text-muted">This is a stand-in model built from the giver's measurements, not a 3D scan of the actual item. Its size is locked to the real size; colour and styling are illustrative, so check the photo for how it really looks.</p>
            </div>
            </>}
          </div>
        </div>
      )}
    </>
  );
}

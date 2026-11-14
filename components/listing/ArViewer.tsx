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

type ModelViewerEl = HTMLElement & { canActivateAR?: boolean; activateAR?: () => Promise<void> };

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
    el.addEventListener("load", onLoad); el.addEventListener("ar-status", onAr);
    return () => { el.removeEventListener("load", onLoad); el.removeEventListener("ar-status", onAr); };
  }, [src, open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        <div role="dialog" aria-modal="true" aria-labelledby="ar-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={() => setOpen(false)}>
          <div className={`rise flex max-h-[100dvh] w-full ${mode === "photo" ? "max-w-3xl" : "max-w-xl"} flex-col overflow-y-auto rounded-t-3xl bg-surface sm:rounded-3xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 p-4 pb-2">
              <div>
                <h2 id="ar-title" className="font-display text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted">{size} · from the giver</p>
              </div>
              <button type="button" aria-label="Close" className="rounded-full p-2 hover:bg-sunken" onClick={() => setOpen(false)}><Icon name="x" /></button>
            </div>

            <div role="tablist" aria-label="How to preview" className="mx-4 mb-3 grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1 text-sm font-semibold">
              {([["3d", "3D and phone AR"], ["photo", "In a photo of my room"]] as const).map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
                  className={`rounded-lg px-3 py-2 ${mode === k ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}>{label}</button>
              ))}
            </div>

            {mode === "photo" ? (
              <div className="bg-sunken" data-testid="photo-stage">
                <PhotoPlacer title={title} category={category} widthM={widthM!} depthM={depthM!} heightM={heightM!} unit={unit} />
              </div>
            ) : <>
            <div className="relative h-[55dvh] min-h-72 bg-sunken" data-testid="ar-stage" data-state={state}>
              {state === "loading" && <p className="absolute inset-0 flex items-center justify-center text-muted">Building a to-scale model…</p>}
              {state === "error" && <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center text-bad">We couldn't load the 3D viewer. Check your connection and try again.</p>}
              {state === "ready" && src && (
                <model-viewer ref={mv} src={src} alt={`To-scale model of ${title}`} ar="" ar-modes="webxr quick-look" ar-scale="fixed" ar-placement="floor"
                  camera-controls="" touch-action="pan-y" shadow-intensity="1" exposure="1.1" camera-orbit="35deg 70deg auto" style={{ width: "100%", height: "100%" }}>
                  <button slot="ar-button" type="button" className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-5 py-3 font-semibold text-white shadow-lg">
                    Place it in my room
                  </button>
                </model-viewer>
              )}
            </div>

            <div className="space-y-2 p-4 text-sm">
              {state === "ready" && arSupported === false && (
                <p className="rounded-xl bg-sunken p-3" data-testid="ar-phone-hint"><strong>On a laptop?</strong> <button type="button" className="font-semibold text-accent underline" onClick={() => setMode("photo")}>Try it in a photo of your room</button>, or open this page on your phone to place it on your floor through the camera.</p>
              )}
              {arSupported && !arFailed && <p>Tap <strong>Place it in my room</strong>, then point your camera at the floor and move the phone slowly until it finds the floor. Drag to move it, twist with two fingers to turn it.</p>}
              {arFailed && <p role="alert" className="text-bad">Your phone couldn't start AR. Try more light, or a floor with some texture.</p>}
              <p className="text-muted">This is a simple stand-in shape built from the giver's measurements, not a 3D scan of the actual item. Its size is locked to the real size.</p>
            </div>
            </>}
          </div>
        </div>
      )}
    </>
  );
}

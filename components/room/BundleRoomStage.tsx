"use client";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/categories";
import { makeGlb } from "@/lib/room/glb";
import { embedUrl } from "@/lib/matterport/tour";

const BUNDLE_PATH = "/matterport-bundle/showcase.html";

export type StageItem = { id: string; title: string; category: Category; widthM: number | null; depthM: number | null; heightM: number | null };
type Vec = { x: number; y: number; z: number };
type Comp = { inputs: Record<string, unknown>; events: Record<string, boolean> };
type Node3 = { position: { set: (x: number, y: number, z: number) => void }; obj3D?: { rotation: { y: number } }; rotation?: { y: number }; addComponent: (name: string, inputs: object) => Comp };
type SceneObj = { addNode: () => Node3; start: () => void; stop?: () => void; addEmitPath?: (c: Comp, name: string) => unknown; spyOnEvent?: (spy: { path: unknown; onEvent: (d?: unknown) => void }) => unknown };
type BundleSdk = {
  Scene: { createObjects: (n: number) => Promise<SceneObj[]> };
  Sweep: { current: { subscribe: (cb: (s: { puckPosition?: Vec; floorPosition?: Vec; position?: Vec }) => void) => { cancel: () => void } } };
};
type BundleWindow = Window & { MP_SDK?: { connect: (w: Window) => Promise<BundleSdk> } };
/** Floor point under the viewer: the sweep puck sits on the floor; `position` is camera height (~1.4 m up), so it is only a last resort. */
const CAMERA_HEIGHT_M = 1.4;
function floorOf(s: { puckPosition?: Vec; floorPosition?: Vec; position?: Vec }): Vec | null {
  if (s.floorPosition) return s.floorPosition;
  if (s.puckPosition) return s.puckPosition;
  return s.position ? { ...s.position, y: s.position.y - CAMERA_HEIGHT_M } : null;
}
type Placed = { item: StageItem; node: Node3 };

/**
 * The room. A self-hosted Matterport player (Bundle SDK) shows the scanned apartment; each listing furniture piece is
 * exported to a to-scale GLB and added to the scene. Items without confirmed measurements are never drawn.
 * Placement is a runtime overlay: nothing is saved and it is not calibrated to the scan's walls.
 */
export function BundleRoomStage({ modelId, sdkKey, title, items }: { modelId: string; sdkKey: string; title: string; items: StageItem[] }) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const sdkRef = useRef<BundleSdk | null>(null);
  const placed = useRef<Placed[]>([]);
  const here = useRef<Vec | null>(null);
  const gizmo = useRef<Comp | null>(null);
  const selectRef = useRef<(id: string | null) => void>(() => {});
  const [selected, setSelected] = useState<string | null>(null);
  const [gizmoMode, setGizmoMode] = useState<"translate" | "rotate">("translate");
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<{ state: "loading" | "ready" | "error"; text: string }>({ state: "loading", text: "Starting the Matterport player…" });
  const [shown, setShown] = useState<string[]>([]);
  const src = `${BUNDLE_PATH}?m=${encodeURIComponent(modelId)}&applicationKey=${encodeURIComponent(sdkKey)}&play=1&qs=1`;
  const sized = items.filter((i) => i.widthM != null && i.depthM != null && i.heightM != null);
  const unsized = items.filter((i) => !sized.includes(i));

  const layout = () => {
    const p = here.current;
    if (!p) return;
    placed.current.forEach(({ node }, n) => { node.position.set(p.x + 1 + n * 1.2, p.y, p.z + 1); const r = node.obj3D?.rotation ?? node.rotation; if (r) r.y = 0; });
    setGone(new Set());
  };
  const select = (id: string | null) => {
    setSelected(id);
    const c = gizmo.current;
    if (!c) return;
    const hit = id ? placed.current.find((x) => x.item.id === id) : null;
    c.inputs.selection = hit ? hit.node : null;
    c.inputs.visible = !!hit;
  };
  const setMode = (m: "translate" | "rotate") => {
    setGizmoMode(m);
    const c = gizmo.current;
    if (c) { c.inputs.mode = m; c.inputs.showY = m === "rotate"; }
  };
  const remove = (id: string) => {
    const hit = placed.current.find((x) => x.item.id === id);
    if (!hit) return;
    hit.node.position.set(0, -100, 0);
    setGone((g) => new Set(g).add(id));
    if (selected === id) select(null);
  };
  const putBack = (id: string) => {
    const hit = placed.current.find((x) => x.item.id === id);
    const p = here.current;
    if (!hit || !p) return;
    hit.node.position.set(p.x + 1, p.y, p.z + 1);
    setGone((g) => { const n = new Set(g); n.delete(id); return n; });
  };

  useEffect(() => {
    let cancelled = false;
    let sub: { cancel: () => void } | undefined;
    const urls: string[] = [];
    const fail = (text: string) => { if (!cancelled) setStatus({ state: "error", text }); };
    const timer = setTimeout(() => fail("The Matterport player did not respond. Check the bundle install, SDK key and allowed domains."), 30000);
    const el = frame.current;
    const run = async () => {
      const w = el?.contentWindow as BundleWindow | null;
      if (!w?.MP_SDK) return fail("The Bundle SDK is not installed. Run `npm run matterport:bundle`.");
      try {
        const sdk = await w.MP_SDK.connect(w);
        sdkRef.current = sdk;
        const out: Placed[] = [];
        // glTF materials render black in the Bundle scene unless it has lights.
        const [lights] = await sdk.Scene.createObjects(1);
        const ln = lights.addNode();
        ln.addComponent("mp.ambientLight", { intensity: 1.2, color: { r: 1, g: 1, b: 1 } });
        const sun = lights.addNode();
        sun.addComponent("mp.directionalLight", { intensity: 0.8, color: { r: 1, g: 1, b: 1 }, position: { x: 0, y: 5, z: 2 } });
        lights.start();
        const [tools] = await sdk.Scene.createObjects(1);
        gizmo.current = tools.addNode().addComponent("mp.transformControls", { visible: false, mode: "translate", selection: null, showX: true, showY: false, showZ: true });
        tools.start();
        for (const item of sized) {
          const url = URL.createObjectURL(await makeGlb(item.category, item.widthM!, item.depthM!, item.heightM!));
          urls.push(url);
          const [obj] = await sdk.Scene.createObjects(1);
          const node = obj.addNode();
          const comp = node.addComponent("mp.gltfLoader", { url });
          try {
            comp.events["INTERACTION.CLICK"] = true;
            const path = obj.addEmitPath?.(comp, "INTERACTION.CLICK");
            if (path) obj.spyOnEvent?.({ path, onEvent: () => selectRef.current(item.id) });
          } catch { /* clicking a piece is optional: the list below selects too */ }
          node.position.set(0, -100, 0); // hidden until the viewer's position is known
          obj.start();
          out.push({ item, node });
        }
        if (cancelled) return;
        placed.current = out;
        sub = sdk.Sweep.current.subscribe((s) => {
          const p = s.floorPosition ?? s.position;
          if (!p || here.current) return;
          here.current = p; layout();
          clearTimeout(timer);
          setShown(out.map((o) => o.item.id));
          setStatus({ state: "ready", text: out.length ? `${out.length} piece${out.length === 1 ? "" : "s"} placed in the tour at your viewpoint. Walk to another spot and press “Place at my viewpoint” to move them.` : "The tour is ready. Add a measured item to see it here." });
        });
      } catch (e) { fail(`Bundle SDK error: ${e instanceof Error ? e.message : "unknown"}`); }
    };
    const onLoad = () => { void run(); };
    el?.addEventListener("load", onLoad);
    return () => { cancelled = true; clearTimeout(timer); sub?.cancel(); el?.removeEventListener("load", onLoad); urls.forEach(URL.revokeObjectURL); };
  }, [src]);

  useEffect(() => { selectRef.current = select; });

  const placeHere = () => {
    const sdk = sdkRef.current;
    if (!sdk) return;
    const sub = sdk.Sweep.current.subscribe((s) => { const p = floorOf(s); if (p) { here.current = p; layout(); } sub.cancel(); });
  };

  return (
    <section aria-label="3D room" data-testid="bundle-stage" data-state={status.state} data-shown={shown.length} className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-lg">Your 3D room</h2>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-sunken">
        <iframe ref={frame} src={src} title={`3D room: ${title}`} allow="fullscreen; xr-spatial-tracking" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
      </div>
      <p role="status" data-testid="bundle-status" className={`text-sm ${status.state === "error" ? "text-bad" : "text-muted"}`}>{status.text}</p>
      {status.state === "ready" && sized.length > 0 && <button type="button" onClick={placeHere} className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90">Place at my viewpoint</button>}
      {status.state === "ready" && sized.length > 0 && (
        <div className="space-y-2" data-testid="piece-controls">
          <p className="text-sm text-muted">Click a piece in the tour (or its name here), then drag the arrows to move it or the ring to turn it.</p>
          <ul className="space-y-2">
            {sized.map((i) => {
              const removed = gone.has(i.id), on = selected === i.id;
              const b = "rounded-lg border border-line px-2.5 py-1 text-sm hover:bg-sunken";
              return (
                <li key={i.id} className="flex flex-wrap items-center gap-2">
                  <button type="button" aria-pressed={on} disabled={removed} onClick={() => select(on ? null : i.id)} className={`${b} min-w-32 text-left font-medium ${on ? "border-accent bg-sunken" : ""}`}>{i.title}</button>
                  {removed ? <button type="button" className={b} onClick={() => putBack(i.id)}>Put back</button> : on && (<>
                    <button type="button" aria-pressed={gizmoMode === "translate"} className={b} onClick={() => setMode("translate")}>Move</button>
                    <button type="button" aria-pressed={gizmoMode === "rotate"} className={b} onClick={() => setMode("rotate")}>Rotate</button>
                    <button type="button" className={`${b} text-bad`} onClick={() => remove(i.id)}>Remove</button>
                  </>)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {unsized.length > 0 && <p className="text-sm text-muted">Not shown, measurements not provided: {unsized.map((i) => i.title).join(", ")}.</p>}
      <p className="text-xs text-muted">Furniture is a to-scale stand-in built from the giver’s measurements, not a scan. Placement is not saved. Tour: Matterport. Data: CoStar. <a className="underline" href={embedUrl(modelId)} target="_blank" rel="noopener noreferrer">Open the plain tour</a></p>
    </section>
  );
}

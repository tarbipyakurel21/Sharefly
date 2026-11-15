"use client";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/categories";
import { makeGlb } from "@/lib/room/glb";
import { embedUrl } from "@/lib/matterport/tour";

const BUNDLE_PATH = "/matterport-bundle/showcase.html";

export type StageItem = { id: string; title: string; category: Category; widthM: number | null; depthM: number | null; heightM: number | null };
type Vec = { x: number; y: number; z: number };
type Comp = { inputs: Record<string, unknown>; events: Record<string, boolean> };
type Node3 = { position: { x?: number; y?: number; z?: number; set: (x: number, y: number, z: number) => void }; obj3D?: { rotation: { y: number } }; rotation?: { y: number }; addComponent: (name: string, inputs: object) => Comp };
type Spy = { path: unknown; onEvent: (d?: unknown) => void };
type SceneObj = { addNode: () => Node3; start: () => void; stop?: () => void; addEmitPath?: (c: Comp, name: string) => unknown; spyOnEvent?: (spy: Spy) => unknown };
type BundleSdk = {
  Scene: { createObjects: (n: number) => Promise<SceneObj[]> };
  Camera?: { pose: { subscribe: (cb: (p: { rotation?: { x: number; y: number } }) => void) => { cancel: () => void } } };
  Sweep: { current: { subscribe: (cb: (s: { puckPosition?: Vec; floorPosition?: Vec }) => void) => { cancel: () => void } } };
};
type BundleWindow = Window & { MP_SDK?: { connect: (w: Window) => Promise<BundleSdk> } };
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
  const yaw = useRef(0);
  const lastSet = useRef(new Map<string, Vec>());
  const gizmo = useRef<Comp | null>(null);
  const nav = useRef<Comp | null>(null);
  const busy = useRef({ hover: false, drag: false, until: 0 });
  const selectRef = useRef<(id: string | null) => void>(() => {});
  const [selected, setSelected] = useState<string | null>(null);
  const [gizmoMode, setGizmoMode] = useState<"translate" | "rotate">("translate");
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<{ state: "loading" | "ready" | "error"; text: string }>({ state: "loading", text: "Starting the Matterport player…" });
  const [shown, setShown] = useState<string[]>([]);
  const src = `${BUNDLE_PATH}?m=${encodeURIComponent(modelId)}&applicationKey=${encodeURIComponent(sdkKey)}&play=1&qs=1`;
  const sized = items.filter((i) => i.widthM != null && i.depthM != null && i.heightM != null);
  const unsized = items.filter((i) => !sized.includes(i));

  // Spot straight ahead of the viewer, on the floor (the sweep puck), at least 2 ft (0.61 m) from the viewpoint.
  const spot = (n: number, item: StageItem) => {
    const p = here.current!;
    const a = (yaw.current * Math.PI) / 180;
    const fx = -Math.sin(a), fz = -Math.cos(a), rx = Math.cos(a), rz = -Math.sin(a);
    const dist = 0.7 + (item.depthM ?? 0) / 2; // near edge is ~0.7 m (2.3 ft) away
    let side = 0; // pieces beyond the first sit beside it, never behind it
    for (let k = 0; k < n; k++) side += (placed.current[k].item.widthM ?? 0.8) + 0.2;
    const lateral = n === 0 ? 0 : side - (placed.current[0].item.widthM ?? 0.8) / 2 + (item.widthM ?? 0.8) / 2;
    return { x: p.x + fx * dist + rx * lateral, y: p.y, z: p.z + fz * dist + rz * lateral, ry: a };
  };
  const place = (n: number) => {
    const { item, node } = placed.current[n];
    const q = spot(n, item);
    node.position.set(q.x, q.y, q.z);
    lastSet.current.set(item.id, { x: q.x, y: q.y, z: q.z });
    const r = node.obj3D?.rotation ?? node.rotation;
    if (r) r.y = q.ry;
  };
  const layout = () => {
    if (!here.current) return;
    placed.current.forEach((_, n) => place(n));
    setGone(new Set());
  };
  const select = (id: string | null) => {
    setSelected(id);
    const c = gizmo.current;
    if (!c) return;
    const hit = id ? placed.current.find((x) => x.item.id === id) : null;
    // The gizmo shows exactly when it has a selection (this runtime has no `visible` input, and its inputs are sealed).
    try { c.inputs.selection = hit ? hit.node : null; } catch { /* keep the UI usable if the player rejects it */ }
  };
  const setMode = (m: "translate" | "rotate") => {
    setGizmoMode(m);
    const c = gizmo.current;
    if (!c) return;
    // Rotate turns the piece about the vertical axis only; Move slides it along the floor (X/Z).
    try { c.inputs.mode = m; c.inputs.showX = m === "translate"; c.inputs.showY = m === "rotate"; c.inputs.showZ = m === "translate"; } catch { /* ignore */ }
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
    if (!hit || !here.current) return;
    place(placed.current.indexOf(hit));
    setGone((g) => { const n = new Set(g); n.delete(id); return n; });
  };

  useEffect(() => {
    let cancelled = false;
    let sub: { cancel: () => void } | undefined;
    let camSub: { cancel: () => void } | undefined;
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
        const gnode = tools.addNode();
        const g = gnode.addComponent("mp.transformControls", { mode: "translate", selection: null, showX: true, showY: false, showZ: true, size: 1.6 });
        gizmo.current = g;
        // While the pointer is over or dragging the gizmo, the tour must not walk, look around or (de)select pieces.
        nav.current = gnode.addComponent("mp.input", { userNavigationEnabled: true });
        const sync = () => {
          const b = busy.current;
          if (!b.drag) b.until = b.hover ? Date.now() + 250 : b.until;
          if (nav.current) nav.current.inputs.userNavigationEnabled = !(b.hover || b.drag);
        };
        const watch = (ev: string, fn: (d?: unknown) => void) => {
          try { g.events[ev] = true; const path = tools.addEmitPath?.(g, ev); if (path) tools.spyOnEvent?.({ path, onEvent: fn }); } catch { /* optional: the gizmo still works without it */ }
        };
        watch("INTERACTION.HOVER", (d) => { busy.current.hover = !!(d as { hover?: boolean } | undefined)?.hover; sync(); });
        // This runtime only exposes HOVER and DRAG on the gizmo (no begin/end): a drag ends when events stop.
        let dragTimer: ReturnType<typeof setTimeout> | undefined;
        watch("INTERACTION.DRAG", () => {
          busy.current.drag = true; sync();
          clearTimeout(dragTimer);
          dragTimer = setTimeout(() => { busy.current.drag = false; busy.current.until = Date.now() + 250; sync(); }, 300);
        });
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
            if (path) obj.spyOnEvent?.({ path, onEvent: () => { const b = busy.current; if (!b.hover && !b.drag && Date.now() > b.until) selectRef.current(item.id); } });
          } catch { /* clicking a piece is optional: the list below selects too */ }
          node.position.set(0, -100, 0); // hidden until the viewer's position is known
          obj.start();
          out.push({ item, node });
        }
        if (cancelled) return;
        placed.current = out;
        camSub = sdk.Camera?.pose.subscribe((c) => { if (c.rotation) yaw.current = c.rotation.y; });
        sub = sdk.Sweep.current.subscribe((s) => {
          const p = s.puckPosition ?? s.floorPosition;
          if (!p) return;
          const first = !here.current;
          here.current = p;
          if (!first) {
            // The viewer moved: bring pieces they have not moved or removed to the new viewpoint (after the camera turns).
            setTimeout(() => {
              if (cancelled) return;
              placed.current.forEach(({ item, node }, n) => {
                const was = lastSet.current.get(item.id), now = node.position;
                const untouched = !was || now.x === undefined || (Math.abs(now.x - was.x) < 0.02 && Math.abs((now.y ?? 0) - was.y) < 0.02 && Math.abs((now.z ?? 0) - was.z) < 0.02);
                if (untouched) place(n);
              });
            }, 400);
            return;
          }
          layout();
          clearTimeout(timer);
          setShown(out.map((o) => o.item.id));
          setStatus({ state: "ready", text: out.length ? `${out.length} piece${out.length === 1 ? "" : "s"} placed in the tour at your viewpoint.` : "The tour is ready. Add a measured item to see it here." });
        });
      } catch (e) { fail(`Bundle SDK error: ${e instanceof Error ? e.message : "unknown"}`); }
    };
    const onLoad = () => { void run(); };
    el?.addEventListener("load", onLoad);
    return () => { cancelled = true; clearTimeout(timer); sub?.cancel(); camSub?.cancel(); el?.removeEventListener("load", onLoad); urls.forEach(URL.revokeObjectURL); };
  }, [src]);

  useEffect(() => { selectRef.current = select; });

  const stage = useRef<HTMLDivElement | null>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggleFull = () => {
    const el = stage.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  };

  return (
    <section aria-label="3D room" data-testid="bundle-stage" data-state={status.state} data-shown={shown.length} className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-lg">Your 3D room</h2>
      <div ref={stage} data-testid="bundle-viewer" className={`relative overflow-hidden rounded-xl bg-sunken ${full ? "h-screen w-screen rounded-none" : "aspect-video"}`}>
        <iframe ref={frame} src={src} title={`3D room: ${title}`} allow="fullscreen; xr-spatial-tracking" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
        <button type="button" onClick={toggleFull} aria-pressed={full} data-testid="fullscreen-toggle" className="absolute right-2 top-2 z-10 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-semibold text-white hover:bg-black/85">{full ? "Exit full screen" : "Full screen"}</button>
        {status.state === "ready" && sized.length > 0 && (
          <div data-testid="piece-controls" className="absolute inset-x-2 bottom-2 z-10 max-h-[45%] space-y-1 overflow-y-auto rounded-xl bg-black/70 p-2 text-white">
            <p className="text-xs text-white/80">Click a piece in the tour (or its name), then drag the arrows to move it or the ring to turn it.</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {sized.map((i) => {
                const removed = gone.has(i.id), on = selected === i.id;
                const b = "rounded-lg border border-white/30 px-2.5 py-1 text-sm hover:bg-white/15";
                return (
                  <li key={i.id} className="flex flex-wrap items-center gap-1.5">
                    <button type="button" aria-pressed={on} disabled={removed} onClick={() => select(on ? null : i.id)} className={`${b} font-medium ${on ? "border-white bg-white/25" : ""}`}>{i.title}</button>
                    {removed ? <button type="button" className={b} onClick={() => putBack(i.id)}>Put back</button> : on && (<>
                      <button type="button" aria-pressed={gizmoMode === "translate"} className={`${b} aria-pressed:bg-white/25`} onClick={() => setMode("translate")}>Move</button>
                      <button type="button" aria-pressed={gizmoMode === "rotate"} className={`${b} aria-pressed:bg-white/25`} onClick={() => setMode("rotate")}>Rotate</button>
                      <button type="button" className={`${b} text-red-300`} onClick={() => remove(i.id)}>Remove</button>
                    </>)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <p role="status" data-testid="bundle-status" className={`text-sm ${status.state === "error" ? "text-bad" : "text-muted"}`}>{status.text}</p>
      {unsized.length > 0 && <p className="text-sm text-muted">Not shown, measurements not provided: {unsized.map((i) => i.title).join(", ")}.</p>}
      <p className="text-xs text-muted">Furniture is a to-scale stand-in built from the giver’s measurements, not a scan. Placement is not saved. Tour: Matterport. Data: CoStar. <a className="underline" href={embedUrl(modelId)} target="_blank" rel="noopener noreferrer">Open the plain tour</a></p>
    </section>
  );
}

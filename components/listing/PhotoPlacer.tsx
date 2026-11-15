"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PerspectiveCamera } from "three";
import type { Category } from "@/lib/categories";
import { buildFurniture, disposeFurniture } from "@/lib/room/model";
import {
  cameraHeightFromVertical, clampToPhoto, projectFloor, DEFAULT_CAMERA_HEIGHT_M, DEFAULT_FOCAL_35MM, DEFAULT_PITCH_DEG, floorHit, lineLength,
  MAX_PHOTO_BYTES, MIN_LINE_PX, readFocal35, toNdc, verticalFov, type Line, type PhotoCamera, type Pt,
} from "@/lib/room/photo";
import { formatLength, parseLength, type Unit } from "@/lib/units";
import { PHOTO_ACCEPT, toDisplayableBlob } from "@/lib/image-decode";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";

type Photo = { url: string; w: number; h: number; focal35: number | null };
type Props = { title: string; category: Category; widthM: number; depthM: number; heightM: number; unit: Unit };
const deg = (d: number) => (d * Math.PI) / 180;

/** Matches the three.js camera to the estimated phone camera. */
function CameraRig({ cam }: { cam: PhotoCamera }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const c = camera as PerspectiveCamera;
    c.fov = (cam.vfovRad * 180) / Math.PI; c.near = 0.05; c.far = 100;
    c.position.set(0, cam.heightM, 0); c.rotation.set(-cam.pitchRad, 0, 0);
    c.updateProjectionMatrix(); invalidate();
  }, [camera, cam, invalidate]);
  return null;
}

function Item({ category, w, d, h, pos, yaw }: { category: Category; w: number; d: number; h: number; pos: { x: number; z: number }; yaw: number }) {
  const obj = useMemo(() => buildFurniture(category, w, d, h), [category, w, d, h]);
  useEffect(() => () => disposeFurniture(obj), [obj]);
  return (
    <group position={[pos.x, 0, pos.z]} rotation={[0, yaw, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} scale={[w * 0.62, d * 0.62, 1]}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <primitive object={obj} />
    </group>
  );
}

export default function PhotoPlacer({ title, category, widthM, depthM, heightM, unit }: Props) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [mode, setMode] = useState<"place" | "measure">("place");
  const [line, setLine] = useState<Line | null>(null);
  const [refText, setRefText] = useState("");
  const [calibratedWith, setCalibratedWith] = useState<number | null>(null);
  const [camHeight, setCamHeight] = useState(DEFAULT_CAMERA_HEIGHT_M);
  const [pitchDeg, setPitchDeg] = useState(DEFAULT_PITCH_DEG);
  const [pos, setPos] = useState<{ x: number; z: number } | null>(null);
  const [yawDeg, setYawDeg] = useState(-20);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const [glReady, setGlReady] = useState(false);
  const drag = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !photo) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [photo]);
  const scale = photo && box.w ? Math.min(box.w / photo.w, box.h / photo.h) : 1;

  const focal = photo?.focal35 ?? DEFAULT_FOCAL_35MM;
  const cam: PhotoCamera | null = useMemo(() => photo && ({
    heightM: camHeight, pitchRad: deg(pitchDeg), vfovRad: verticalFov(focal, photo.w, photo.h), aspect: photo.w / photo.h,
  }), [photo, camHeight, pitchDeg, focal]);

  // First placement: on the floor a little below the middle of the photo.
  useEffect(() => {
    if (!cam || pos) return;
    for (const y of [-0.55, -0.7, -0.85]) { const hit = floorHit({ x: 0, y }, cam); if (hit) { setPos(hit); return; } }
  }, [cam, pos]);

  async function choose(file: File | undefined) {
    setErr(null);
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) return setErr("That photo is over 20 MB. Try a smaller one.");
    setOpening(true);
    let blob: Blob, focal35: number | null = null;
    try {
      [blob, focal35] = await Promise.all([toDisplayableBlob(file), file.arrayBuffer().then((b) => readFocal35(new Uint8Array(b))).catch(() => null)]);
    } catch (e) { setOpening(false); return setErr((e as Error).message); }
    const url = URL.createObjectURL(blob);
    const probe = new Image();
    probe.onload = () => {
      setOpening(false); setGlReady(false); setMode("place"); setLine(null); setPos(null);
      setCalibratedWith(null); setCamHeight(DEFAULT_CAMERA_HEIGHT_M); setPitchDeg(DEFAULT_PITCH_DEG);
      setPhoto({ url, w: probe.naturalWidth, h: probe.naturalHeight, focal35 });
    };
    probe.onerror = () => { setOpening(false); URL.revokeObjectURL(url); setErr("We couldn't open that photo. Please try another."); };
    probe.src = url;
  }

  const toNatural = (e: React.PointerEvent): Pt => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return clampToPhoto({ x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }, photo!);
  };
  const moveTo = (p: Pt) => { const hit = floorHit(toNdc(p, photo!), cam!); if (hit) setPos(hit); };

  function onDown(e: React.PointerEvent) {
    if (!photo || !cam) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = true;
    const p = toNatural(e);
    if (mode === "place") moveTo(p); else setLine({ a: p, b: p });
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const p = toNatural(e);
    if (mode === "place") moveTo(p); else setLine((l) => (l ? { a: l.a, b: p } : l));
  }
  const onUp = () => { drag.current = false; };
  function onKey(e: React.KeyboardEvent) {
    if (mode !== "place" || !pos) return;
    const d: Record<string, [number, number]> = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
    if (d[e.key]) { e.preventDefault(); setPos({ x: pos.x + d[e.key][0], z: Math.min(-0.3, pos.z + d[e.key][1]) }); }
  }

  const refM = parseLength(refText, unit);
  const lineOk = !!line && lineLength(line) * scale >= MIN_LINE_PX;
  function applyMeasurement() {
    if (!line || !photo || !cam || refM == null) return setErr("Draw the line on the photo and enter its height, like 6'8\" or 2 m.");
    const [bottom, top] = line.a.y > line.b.y ? [line.a, line.b] : [line.b, line.a];
    // Solve with the camera at 1 m: the result scales linearly, so this is independent of the current guess.
    const h = cameraHeightFromVertical(toNdc(bottom, photo), toNdc(top, photo), refM, { ...cam, heightM: 1 });
    if (h == null) return setErr("That line doesn't look like it starts on the floor. Draw from where the door meets the floor straight up to its top. If it still fails, adjust Camera tilt first.");
    setErr(null); setCalibratedWith(refM); setMode("place"); setLine(null);
    // Keep the item on the same spot in the photo: a new camera height scales the floor uniformly.
    setPos((p) => p && { x: (p.x * h) / camHeight, z: (p.z * h) / camHeight });
    setCamHeight(h);
  }

  /** Changing the tilt keeps the item on the same spot in the photo; only its size and angle change. */
  function changePitch(nextDeg: number) {
    if (cam && pos) {
      const at = projectFloor(pos, cam);
      const hit = at && floorHit(at, { ...cam, pitchRad: deg(nextDeg) });
      if (hit) setPos(hit);
      else if (at) return; // that tilt would put the item above the horizon; ignore
    }
    setPitchDeg(nextDeg);
  }

  function saveImage() {
    if (!photo || !imgRef.current || !glRef.current) return setErr("The preview is still loading. Try again in a moment.");
    const c = document.createElement("canvas");
    c.width = photo.w; c.height = photo.h;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(imgRef.current, 0, 0, photo.w, photo.h);
    ctx.drawImage(glRef.current, 0, 0, photo.w, photo.h);
    const a = document.createElement("a");
    a.download = `${title.replace(/[^\w-]+/g, "-").toLowerCase()}-in-my-room.png`;
    try { a.href = c.toDataURL("image/png"); } catch { return setErr("We couldn't save that image. Try a screenshot instead."); }
    document.body.appendChild(a); a.click(); a.remove();
  }

  const fileInput = <input ref={fileRef} type="file" accept={PHOTO_ACCEPT} className="sr-only" data-testid="room-photo-input" onChange={(e) => choose(e.target.files?.[0])} />;

  if (!photo) {
    return (
      <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3 p-6 text-center" data-testid="photo-empty">
        <p className="font-semibold">Use a photo of your room</p>
        <p className="max-w-sm text-sm text-muted">Stand back and take a photo of the spot where it would go, with the floor visible. The photo stays on this device; it isn't uploaded.</p>
        {fileInput}
        <Button onClick={() => fileRef.current?.click()} loading={opening}>Choose a photo</Button>
        <p className="text-xs text-muted">JPEG, PNG, HEIC (iPhone), WebP, AVIF or GIF</p>
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      </div>
    );
  }

  const slider = "w-full accent-[var(--color-accent)]";
  return (
    <div className="flex flex-col">
      <div ref={boxRef} className="relative flex h-[50dvh] shrink-0 select-none items-center justify-center overflow-hidden bg-black sm:h-[58dvh]">
        <div className="relative" style={{ width: photo.w * scale, height: photo.h * scale }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={photo.url} alt="Your room" className="block h-full w-full select-none" draggable={false} />
          {cam && pos && box.w > 0 && (
            <div className={`pointer-events-none absolute inset-0 ${mode === "measure" ? "opacity-40" : ""}`} data-testid="photo-item">
              <Canvas frameloop="demand" dpr={[1, 2]} gl={{ alpha: true, preserveDrawingBuffer: true, antialias: true }}
                onCreated={({ gl }) => { glRef.current = gl.domElement; setGlReady(true); }}>
                <CameraRig cam={cam} />
                <ambientLight intensity={1.1} />
                <directionalLight position={[2, 5, 3]} intensity={1.6} />
                <Item category={category} w={widthM} d={depthM} h={heightM} pos={pos} yaw={deg(yawDeg)} />
              </Canvas>
            </div>
          )}
          {mode === "measure" && line && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${photo.w} ${photo.h}`} preserveAspectRatio="none">
              <line x1={line.a.x} y1={line.a.y} x2={line.b.x} y2={line.b.y} stroke="#fff" strokeWidth={6 / scale} strokeLinecap="round" />
              <line x1={line.a.x} y1={line.a.y} x2={line.b.x} y2={line.b.y} stroke="#c2562c" strokeWidth={3 / scale} strokeLinecap="round" />
              {[line.a, line.b].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={6 / scale} fill="#c2562c" stroke="#fff" strokeWidth={2 / scale} />)}
            </svg>
          )}
          <div role="application" tabIndex={0} data-testid="photo-surface"
            aria-label={mode === "place" ? "Tap or drag on the floor to move the item. Arrow keys nudge it." : "Drag a line from the bottom of a door to its top."}
            className={`absolute inset-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent ${mode === "place" ? "cursor-grab" : "cursor-crosshair"}`}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey} />
        </div>
      </div>

      <div className="space-y-3 p-4 text-sm">
        {mode === "place" ? (
          <>
            <p><strong>Tap or drag on the floor</strong> to move it. It gets smaller as it goes further back, like it would in real life.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1"><span className="text-muted">Turn</span>
                <input type="range" min={-180} max={180} value={yawDeg} onChange={(e) => setYawDeg(+e.target.value)} className={slider} aria-label="Turn the item" /></label>
              <label className="space-y-1"><span className="text-muted">Camera tilt (if it looks like it's floating or sinking)</span>
                <input type="range" min={-10} max={45} value={pitchDeg} onChange={(e) => changePitch(+e.target.value)} className={slider} aria-label="Camera tilt" /></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={saveImage} disabled={!glReady}>Save image</Button>
              <Button variant="ghost" onClick={() => { setMode("measure"); setLine(null); setErr(null); }}>{calibratedWith ? "Measure again" : "Make it more accurate"}</Button>
              <Button variant="ghost" onClick={() => fileRef.current?.click()}>Different photo</Button>
            </div>
            <p className="text-muted" data-testid="photo-scale-note">
              {calibratedWith
                ? <>Size is set from your {formatLength(calibratedWith, unit)} door measurement.</>
                : <>Size is an <strong>estimate</strong>: we assume the photo was taken at about chest height with {photo.focal35 ? `the ${photo.focal35} mm lens recorded in your photo` : "a typical phone lens"}. If it looks off, tap <em>Make it more accurate</em>.</>}
              {" "}The item is a simple stand-in shape at the giver's measurements, not a photo of it.
            </p>
          </>
        ) : (
          <>
            <p><strong>Make it more accurate:</strong> drag a line from the bottom of a door (where it meets the floor) to its top, then enter its height.</p>
            <div className="flex flex-wrap items-center gap-2">
              <TextInput aria-label="Height of the line you drew" className="w-32" placeholder={unit === "ft" ? `e.g. 6'8"` : "e.g. 2.03 m"} value={refText} onChange={(e) => setRefText(e.target.value)} />
              <button type="button" className="rounded-full border border-line px-3 py-1.5 hover:bg-sunken" onClick={() => setRefText(unit === "ft" ? `6'8"` : "2.03 m")}>Door height (often {unit === "ft" ? "6′8″" : "2.03 m"})</button>
              <Button onClick={applyMeasurement} disabled={!lineOk || refM == null}>Use this measurement</Button>
              <Button variant="ghost" onClick={() => { setMode("place"); setLine(null); setErr(null); }}>Back</Button>
            </div>
          </>
        )}
        {fileInput}
        {err && <p role="alert" className="text-bad">{err}</p>}
      </div>
    </div>
  );
}

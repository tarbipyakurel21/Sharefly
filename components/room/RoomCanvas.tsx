"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import { Furniture } from "./Furniture";
import type { ScanRef } from "@/lib/room/scan-model";
import { corners, clampToRoom, type Dims } from "@/lib/room/geometry";
import { formatLength, type Unit } from "@/lib/units";
import type { PlacedPiece } from "./types";

type Props = {
  /** Giver-provided 3D scans by listing id; pieces without one use the measurement-based stand-in. */
  scans?: Record<string, ScanRef>;
  room: Dims; unit: Unit; pieces: PlacedPiece[]; selectedId: string | null; collidingIds: Set<string>;
  onSelect: (id: string | null) => void; onMove: (id: string, x: number, z: number) => void;
};

const WALL_T = 0.08;

function Walls({ room }: { room: Dims }) {
  const L = room.lengthM, W = room.widthM, H = room.heightM;
  const walls = useMemo(() => [
    { key: "back", pos: [0, H / 2, -L / 2 - WALL_T / 2] as const, size: [W + WALL_T * 2, H, WALL_T] as const, outside: (c: THREE.Vector3) => c.z < -L / 2 },
    { key: "front", pos: [0, H / 2, L / 2 + WALL_T / 2] as const, size: [W + WALL_T * 2, H, WALL_T] as const, outside: (c: THREE.Vector3) => c.z > L / 2 },
    { key: "left", pos: [-W / 2 - WALL_T / 2, H / 2, 0] as const, size: [WALL_T, H, L] as const, outside: (c: THREE.Vector3) => c.x < -W / 2 },
    { key: "right", pos: [W / 2 + WALL_T / 2, H / 2, 0] as const, size: [WALL_T, H, L] as const, outside: (c: THREE.Vector3) => c.x > W / 2 },
  ], [L, W, H]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(({ camera }) => {
    walls.forEach((w, i) => {
      const m = mats.current[i];
      if (!m) return;
      const target = w.outside(camera.position) ? 0.1 : 0.92;
      m.opacity += (target - m.opacity) * 0.2;
    });
  });
  return (
    <group>
      {walls.map((w, i) => (
        <mesh key={w.key} position={w.pos as unknown as [number, number, number]} receiveShadow>
          <boxGeometry args={w.size as unknown as [number, number, number]} />
          <meshStandardMaterial ref={(m) => { mats.current[i] = m; }} color="#efe8dc" transparent opacity={0.92} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Floor({ room }: { room: Dims }) {
  const grid = useMemo(() => {
    const pts: number[] = [];
    const W = room.widthM, L = room.lengthM, step = 0.5;
    for (let x = -W / 2 + step; x < W / 2 - 1e-6; x += step) pts.push(x, 0.002, -L / 2, x, 0.002, L / 2);
    for (let z = -L / 2 + step; z < L / 2 - 1e-6; z += step) pts.push(-W / 2, 0.002, z, W / 2, 0.002, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [room.widthM, room.lengthM]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[room.widthM, room.lengthM]} />
        <meshStandardMaterial color="#d8c6a8" roughness={0.95} />
      </mesh>
      <lineSegments geometry={grid}><lineBasicMaterial color="#b9a888" transparent opacity={0.45} /></lineSegments>
    </group>
  );
}

function TextSprite({ text, position }: { text: string; position: [number, number, number] }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.beginPath(); g.roundRect(4, 8, 248, 48, 24); g.fill();
    g.fillStyle = "#26221d"; g.font = "600 28px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, 128, 33);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => tex.dispose(), [tex]);
  return <sprite position={position} scale={[1.0, 0.25, 1]}><spriteMaterial map={tex} depthTest={false} transparent /></sprite>;
}

function Labels({ room, unit }: { room: Dims; unit: Unit }) {
  return (
    <>
      <TextSprite text={formatLength(room.widthM, unit)} position={[0, 0.05, room.lengthM / 2 + 0.35]} />
      <TextSprite text={formatLength(room.lengthM, unit)} position={[room.widthM / 2 + 0.55, 0.05, 0]} />
    </>
  );
}

function Piece({ p, scan, selected, colliding, onSelect, onDragStart }: { p: PlacedPiece; scan?: ScanRef | null; selected: boolean; colliding: boolean; onSelect: () => void; onDragStart: (e: { point: THREE.Vector3 }) => void }) {
  const outline = useMemo(() => corners(p).map((c) => [c.x - p.x, 0.012, c.z - p.z] as [number, number, number]), [p.x, p.z, p.rotationY, p.widthM, p.depthM]); // eslint-disable-line react-hooks/exhaustive-deps
  const closed = useMemo(() => [...outline, outline[0]], [outline]);
  return (
    <group position={[p.x, 0, p.z]}>
      <group rotation={[0, p.rotationY, 0]}
        onPointerDown={(e) => { e.stopPropagation(); onSelect(); onDragStart({ point: e.point }); }}
        onPointerOver={() => { document.body.style.cursor = "grab"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
        <Furniture category={p.category} w={p.widthM} d={p.depthM} h={p.heightM} ghost={!p.dimensionsConfirmed} tint={colliding ? "#d4574a" : null} scan={scan} />
      </group>
      {!p.dimensionsConfirmed && <Line points={closed} color="#8a5a0b" lineWidth={2} dashed dashSize={0.1} gapSize={0.08} />}
      {selected && <Line points={closed} color="#a94a28" lineWidth={3} />}
    </group>
  );
}

function Scene(props: Props & { controls: React.RefObject<OrbitImpl | null> }) {
  const { room, pieces, selectedId, collidingIds, onSelect, onMove, controls } = props;
  const { camera, gl, raycaster } = useThree();
  const drag = useRef<{ id: string; dx: number; dz: number } | null>(null);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const latest = useRef(pieces);
  latest.current = pieces;

  useEffect(() => {
    function move(ev: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      const r = gl.domElement.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      const p = latest.current.find((x) => x.id === d.id);
      if (!p) return;
      const c = clampToRoom({ ...p, x: hit.x - d.dx, z: hit.z - d.dz }, room);
      onMove(d.id, c.x, c.z);
    }
    function up() {
      if (!drag.current) return;
      drag.current = null;
      if (controls.current) setTimeout(() => { if (controls.current && !drag.current) controls.current.enabled = true; }, 0);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [camera, gl, raycaster, plane, hit, ndc, room, onMove, controls]);

  return (
    <>
      <hemisphereLight args={["#fff6e8", "#b9a888", 0.9]} />
      <directionalLight position={[room.widthM, room.heightM * 2.2, room.lengthM]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-room.widthM} shadow-camera-right={room.widthM} shadow-camera-top={room.lengthM} shadow-camera-bottom={-room.lengthM} shadow-camera-near={0.5} shadow-camera-far={room.heightM * 6} />
      <Floor room={room} />
      <Walls room={room} />
      <Labels room={room} unit={props.unit} />
      {pieces.map((p) => (
        <Piece key={p.id} p={p} scan={p.listingId ? props.scans?.[p.listingId] : null} selected={p.id === selectedId} colliding={collidingIds.has(p.id)} onSelect={() => onSelect(p.id)}
          onDragStart={(e) => { if (controls.current) controls.current.enabled = false; drag.current = { id: p.id, dx: e.point.x - p.x, dz: e.point.z - p.z }; }} />
      ))}
    </>
  );
}

export default function RoomCanvas(props: Props) {
  const controls = useRef<OrbitImpl | null>(null);
  const { room } = props;
  const span = Math.max(room.lengthM, room.widthM);
  return (
    <Canvas shadows="percentage" dpr={[1, 2]} camera={{ position: [room.widthM * 0.7, span * 0.9 + 1, room.lengthM * 0.95 + 1.5], fov: 45, near: 0.1, far: 200 }}
      style={{ touchAction: "none" }} onPointerMissed={() => props.onSelect(null)} aria-label="3D view of your room">
      <color attach="background" args={["#f5efe4"]} />
      <Scene {...props} controls={controls} />
      <OrbitControls ref={controls as never} makeDefault enableDamping dampingFactor={0.12} maxPolarAngle={Math.PI / 2 - 0.04} minDistance={1.5} maxDistance={span * 4 + 4} target={[0, room.heightM / 4, 0]} />
    </Canvas>
  );
}

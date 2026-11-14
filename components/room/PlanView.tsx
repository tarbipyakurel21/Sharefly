"use client";
import { useRef } from "react";
import { corners, clampToRoom, type Dims } from "@/lib/room/geometry";
import type { PlacedPiece } from "./types";

/** Top-down 2D plan from the same data as the 3D room. Also the fallback when WebGL is unavailable. */
export function PlanView({ room, pieces, selectedId, collidingIds, onSelect, onMove }: {
  room: Dims; pieces: PlacedPiece[]; selectedId: string | null; collidingIds: Set<string>; onSelect: (id: string | null) => void; onMove: (id: string, x: number, z: number) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dz: number } | null>(null);
  const pad = 0.3;
  const toWorld = (e: React.PointerEvent) => {
    const s = svg.current!; const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = s.getScreenCTM()!.inverse(); const r = pt.matrixTransform(m);
    return { x: r.x, z: r.y };
  };
  return (
    <svg ref={svg} role="img" aria-label="Top-down plan of your room" viewBox={`${-room.widthM / 2 - pad} ${-room.lengthM / 2 - pad} ${room.widthM + pad * 2} ${room.lengthM + pad * 2}`}
      className="h-full w-full touch-none rounded-2xl bg-sunken" onPointerDown={(e) => { if (e.target === svg.current) onSelect(null); }}
      onPointerMove={(e) => { const d = drag.current; if (!d) return; const w = toWorld(e); const p = pieces.find((x) => x.id === d.id); if (!p) return; const c = clampToRoom({ ...p, x: w.x - d.dx, z: w.z - d.dz }, room); onMove(d.id, c.x, c.z); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <rect x={-room.widthM / 2} y={-room.lengthM / 2} width={room.widthM} height={room.lengthM} fill="#d8c6a8" stroke="#8a7a60" strokeWidth={0.06} />
      {pieces.map((p) => {
        const pts = corners(p).map((c) => `${c.x},${c.z}`).join(" ");
        const sel = p.id === selectedId;
        return (
          <g key={p.id} onPointerDown={(e) => { e.stopPropagation(); onSelect(p.id); (e.target as Element).setPointerCapture?.(e.pointerId); const w = toWorld(e); drag.current = { id: p.id, dx: w.x - p.x, dz: w.z - p.z }; }} className="cursor-grab">
            <polygon points={pts} fill={collidingIds.has(p.id) ? "#d4574a" : "#b0804f"} fillOpacity={p.dimensionsConfirmed ? 0.9 : 0.5} stroke={sel ? "#a94a28" : "#5f4630"} strokeWidth={sel ? 0.06 : 0.03} strokeDasharray={p.dimensionsConfirmed ? undefined : "0.12 0.08"} />
            <text x={p.x} y={p.z} fontSize={0.2} textAnchor="middle" dominantBaseline="middle" fill="#26221d" pointerEvents="none">{p.label.slice(0, 14)}</text>
          </g>
        );
      })}
    </svg>
  );
}

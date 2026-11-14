export type Placed = { x: number; z: number; rotationY: number; widthM: number; depthM: number; heightM: number };
export type Dims = { lengthM: number; widthM: number; heightM: number };
export type Pt = { x: number; z: number };

/** Corners of the rotated footprint. Room: x spans width, z spans length, centred on origin. */
export function corners(p: Placed): Pt[] {
  const hw = p.widthM / 2, hd = p.depthM / 2;
  const c = Math.cos(p.rotationY), s = Math.sin(p.rotationY);
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => ({
    x: p.x + lx * c + lz * s,
    z: p.z - lx * s + lz * c,
  }));
}

/** Half-extents of the axis-aligned box around the rotated footprint. */
export function halfExtents(p: Pick<Placed, "rotationY" | "widthM" | "depthM">) {
  const c = Math.abs(Math.cos(p.rotationY)), s = Math.abs(Math.sin(p.rotationY));
  return { hx: (p.widthM * c + p.depthM * s) / 2, hz: (p.widthM * s + p.depthM * c) / 2 };
}

/** Keep the rotated footprint inside the walls. If it is larger than the room it is centred. */
export function clampToRoom<T extends Placed>(p: T, room: Dims): T {
  const { hx, hz } = halfExtents(p);
  const maxX = room.widthM / 2 - hx, maxZ = room.lengthM / 2 - hz;
  return {
    ...p,
    x: maxX < 0 ? 0 : Math.min(maxX, Math.max(-maxX, p.x)),
    z: maxZ < 0 ? 0 : Math.min(maxZ, Math.max(-maxZ, p.z)),
  };
}

function project(pts: Pt[], ax: Pt): [number, number] {
  let min = Infinity, max = -Infinity;
  for (const p of pts) {
    const v = p.x * ax.x + p.z * ax.z;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}

/** Separating axis test on oriented rectangles. Touching edges do not count as overlap. */
export function overlaps(a: Placed, b: Placed, eps = 1e-6): boolean {
  const ca = corners(a), cb = corners(b);
  const axes: Pt[] = [];
  for (const cs of [ca, cb]) {
    for (let i = 0; i < 2; i++) {
      const e = { x: cs[i + 1].x - cs[i].x, z: cs[i + 1].z - cs[i].z };
      const len = Math.hypot(e.x, e.z) || 1;
      axes.push({ x: -e.z / len, z: e.x / len });
    }
  }
  for (const ax of axes) {
    const [a0, a1] = project(ca, ax);
    const [b0, b1] = project(cb, ax);
    if (a1 <= b0 + eps || b1 <= a0 + eps) return false;
  }
  return true;
}

export type FitStatus = "fits" | "wont_fit" | "cant_confirm";

/** Fit for an item against a room. Unknown dimensions can never be "fits". */
export function fitStatus(
  item: { widthM: number | null; depthM: number | null; heightM: number | null } | null,
  room: Dims | null,
): FitStatus {
  if (!item || item.widthM === null || item.depthM === null || item.heightM === null) return "cant_confirm";
  if (!room) return "cant_confirm";
  if (item.heightM > room.heightM) return "wont_fit";
  const a = item.widthM <= room.widthM && item.depthM <= room.lengthM;
  const b = item.depthM <= room.widthM && item.widthM <= room.lengthM;
  return a || b ? "fits" : "wont_fit";
}

export const FIT_TEXT: Record<FitStatus, string> = {
  fits: "Fits your room",
  wont_fit: "Won't fit your room",
  cant_confirm: "Can't confirm fit yet",
};

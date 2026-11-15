import { z } from "zod";
import { ROOM_LIMITS } from "@/lib/room/defaults";

const FT_TO_M = 0.3048;
const FT2_TO_M2 = 0.092903;

/** Model API room, as returned by `model(id) { rooms { id label dimensionEstimates { ... } } }`. */
export const ApiRoomSchema = z.object({
  id: z.string().min(1),
  label: z.string().nullable().optional(),
  dimensionEstimates: z.object({
    area: z.number().nullable().optional(),
    width: z.number().nullable().optional(),
    depth: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    units: z.string().nullable().optional(),
  }).nullable().optional(),
});
export type ApiRoom = z.infer<typeof ApiRoomSchema>;

export type MeasuredRoom = { id: string; label: string | null; widthM: number; depthM: number; heightM: number; areaM2: number | null };

const round = (v: number) => Math.round(v * 100) / 100;

/**
 * Converts one API room to metric. Returns null when the room cannot be planned honestly:
 * unknown units, or width / depth / height null, zero, or outside the planner's limits.
 * The `units` field of each response is always read, never assumed.
 */
export function toMeasuredRoom(r: ApiRoom): MeasuredRoom | null {
  const d = r.dimensionEstimates;
  if (!d) return null;
  const u = d.units?.toLowerCase();
  const k = u === "metric" ? 1 : u === "imperial" ? FT_TO_M : null;
  if (k == null) return null;
  const pos = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
  const [w, dp, h] = [pos(d.width), pos(d.depth), pos(d.height)];
  if (w == null || dp == null || h == null) return null;
  const [widthM, depthM, heightM] = [round(w * k), round(dp * k), round(h * k)];
  const lw = (v: number) => v >= ROOM_LIMITS.minLW && v <= ROOM_LIMITS.maxLW;
  if (!lw(widthM) || !lw(depthM) || heightM < ROOM_LIMITS.minH || heightM > ROOM_LIMITS.maxH) return null;
  const a = pos(d.area);
  return { id: r.id, label: r.label?.trim() || null, widthM, depthM, heightM, areaM2: a == null ? null : round(a * (k === 1 ? 1 : FT2_TO_M2)) };
}

export function usableRooms(rooms: ApiRoom[]): { rooms: MeasuredRoom[]; unusable: number } {
  const out: MeasuredRoom[] = [];
  for (const r of rooms) { const m = toMeasuredRoom(r); if (m) out.push(m); }
  return { rooms: out, unusable: rooms.length - out.length };
}

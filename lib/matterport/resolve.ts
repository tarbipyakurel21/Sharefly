import { fetchMeasuredRooms, type RoomsResult } from "./model-api";
import { tourCandidates, type MatterportIdSet, type TourLevel } from "./tour";

export type SpaceRooms =
  | { ok: true; level: TourLevel; rooms: Extract<RoomsResult, { ok: true }>["rooms"]; unusable: number }
  | { ok: false; reason: Exclude<RoomsResult, { ok: true }>["reason"] | "no_model" };

/** Tries the unit model first, then floor plan, then community. First model with usable rooms wins. */
export async function measuredRoomsForSpace(ids: MatterportIdSet): Promise<SpaceRooms> {
  const cands = tourCandidates(ids);
  if (!cands.length) return { ok: false, reason: "no_model" };
  let reason: Exclude<RoomsResult, { ok: true }>["reason"] = "not_found";
  for (const c of cands.slice(0, 3)) {
    const r = await fetchMeasuredRooms(c.modelId);
    if (r.ok) return { ok: true, level: c.level, rooms: r.rooms, unusable: r.unusable };
    if (r.reason === "not_configured") return { ok: false, reason: "not_configured" };
    if (r.reason === "unavailable" || reason === "not_found") reason = r.reason;
  }
  return { ok: false, reason };
}

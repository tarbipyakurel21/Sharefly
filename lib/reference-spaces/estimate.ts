import { ROOM_LIMITS } from "@/lib/room/defaults";

const SQFT_TO_M2 = 0.092903;
/** Share of a floor plan's total area assumed to be the main room we plan furniture in. */
export const MAIN_ROOM_SHARE: Record<string, number> = { studio: 0.8, one: 0.4, two: 0.3, threePlus: 0.25 };
export const ASSUMED_ASPECT = 1.25; // length : width
export const ASSUMED_CEILING_M = 2.44; // 8 ft. The kit has no ceiling heights.

export type RoomEstimate = { lengthM: number; widthM: number; heightM: number; mainRoomM2: number };

/**
 * ESTIMATE, not a measurement. The kit gives a unit's total square footage only.
 * Rule: main room area = floor-plan area x share (studio 80%, 1 bed 40%, 2 bed 30%, 3+ bed 25%),
 * shaped as a 1.25 : 1 rectangle, 8 ft ceiling. The person is expected to edit the result.
 */
export function estimateRoom(sqft: number, beds: number | null): RoomEstimate {
  const share = beds == null || beds <= 0 ? MAIN_ROOM_SHARE.studio : beds === 1 ? MAIN_ROOM_SHARE.one : beds === 2 ? MAIN_ROOM_SHARE.two : MAIN_ROOM_SHARE.threePlus;
  const area = Math.max(1, sqft) * SQFT_TO_M2 * share;
  const width = Math.sqrt(area / ASSUMED_ASPECT);
  const clamp = (v: number) => Math.min(ROOM_LIMITS.maxLW, Math.max(ROOM_LIMITS.minLW, v));
  const r = (v: number) => Math.round(v * 100) / 100;
  return { lengthM: r(clamp(width * ASSUMED_ASPECT)), widthM: r(clamp(width)), heightM: ASSUMED_CEILING_M, mainRoomM2: r(area) };
}

/** Floor plan size to use for the estimate: the smaller end of the range, to avoid overstating space. */
export const planSqft = (s: { minSqft: number | null; maxSqft: number | null }) => s.minSqft ?? s.maxSqft;

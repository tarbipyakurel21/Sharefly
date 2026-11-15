import { planSqft } from "./estimate";
import type { ReferenceSpace, RoomSource } from "./types";

export type DimensionsKind = NonNullable<RoomSource["dimensions"]>;

export function toRoomSource(s: ReferenceSpace, dims: { kind: DimensionsKind; roomLabel?: string | null; unitNumber?: string | null } = { kind: "estimate" }): RoomSource {
  return {
    kind: "costar", spaceId: s.id, communityName: s.communityName, floorPlanName: s.floorPlanName, city: s.city, state: s.state,
    beds: s.beds, baths: s.baths, sqft: planSqft(s), estimated: dims.kind === "estimate", dimensions: dims.kind,
    matterportRoomLabel: dims.kind === "estimate" ? null : dims.roomLabel ?? null, unitNumber: dims.unitNumber ?? null, matterport: s.matterport,
  };
}

/** Sizes closer than this (meters) count as unchanged by the person. */
export const SIZE_TOLERANCE_M = 0.05;
export const sameSize = (a: number, b: number) => Math.abs(a - b) <= SIZE_TOLERANCE_M;

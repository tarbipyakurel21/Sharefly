import { planSqft } from "./estimate";
import type { ReferenceSpace, RoomSource } from "./types";

export function toRoomSource(s: ReferenceSpace): RoomSource {
  return {
    kind: "costar", spaceId: s.id, communityName: s.communityName, floorPlanName: s.floorPlanName, city: s.city, state: s.state,
    beds: s.beds, baths: s.baths, sqft: planSqft(s), estimated: true, matterport: s.matterport,
  };
}

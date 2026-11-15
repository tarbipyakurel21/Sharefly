import { ok, route, requireUser, jsonBody, ApiError } from "@/lib/api";
import { RoomBody } from "@/lib/validation";
import { createRoom, listRooms } from "@/lib/db/queries";
import { getReferenceSpaceProvider } from "@/lib/reference-spaces/provider";
import { sameSize, toRoomSource, type DimensionsKind } from "@/lib/reference-spaces/source";
import { measuredRoomsForSpace } from "@/lib/matterport/resolve";

export const GET = route(async () => ok({ rooms: await listRooms((await requireUser()).id) }));
export const POST = route(async (req) => {
  const user = await requireUser();
  const { referenceSpaceId, measuredRoomId, unitNumber, ...b } = RoomBody.parse(await jsonBody(req));
  if (measuredRoomId && !referenceSpaceId) throw new ApiError(400, "invalid_request", "Pick an apartment before choosing one of its measured rooms.");
  let source = null;
  if (referenceSpaceId) {
    const space = await getReferenceSpaceProvider().get(referenceSpaceId);
    if (!space) throw new ApiError(404, "space_not_found", "We couldn't find that apartment floor plan. Please pick another.");
    let kind: DimensionsKind = "estimate";
    let roomLabel: string | null = null;
    if (measuredRoomId) {
      // The server decides whether a size counts as measured: it re-reads the room, the client only names it.
      const r = await measuredRoomsForSpace(space.matterport);
      const m = r.ok ? r.rooms.find((x) => x.id === measuredRoomId) : undefined;
      if (!m) throw new ApiError(409, "measured_room_unavailable", "That measured room isn't available right now. Please pick another room or use the estimate.");
      roomLabel = m.label;
      kind = sameSize(b.lengthM, m.depthM) && sameSize(b.widthM, m.widthM) && sameSize(b.heightM, m.heightM) ? "matterport" : "adjusted";
    }
    source = toRoomSource(space, { kind, roomLabel, unitNumber: unitNumber ?? null });
  }
  return ok({ room: await createRoom(user.id, { ...b, source }) }, 201);
});

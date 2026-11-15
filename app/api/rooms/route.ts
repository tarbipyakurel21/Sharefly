import { ok, route, requireUser, jsonBody, ApiError } from "@/lib/api";
import { RoomBody } from "@/lib/validation";
import { createRoom, listRooms } from "@/lib/db/queries";
import { getReferenceSpaceProvider } from "@/lib/reference-spaces/provider";
import { toRoomSource } from "@/lib/reference-spaces/source";

export const GET = route(async () => ok({ rooms: listRooms((await requireUser()).id) }));
export const POST = route(async (req) => {
  const user = await requireUser();
  const { referenceSpaceId, ...b } = RoomBody.parse(await jsonBody(req));
  let source = null;
  if (referenceSpaceId) {
    const space = await getReferenceSpaceProvider().get(referenceSpaceId);
    if (!space) throw new ApiError(404, "space_not_found", "We couldn't find that apartment floor plan. Please pick another.");
    source = toRoomSource(space);
  }
  return ok({ room: createRoom(user.id, { ...b, source }) }, 201);
});

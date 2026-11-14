import { ok, route, requireUser, jsonBody } from "@/lib/api";
import { RoomBody } from "@/lib/validation";
import { createRoom, listRooms } from "@/lib/db/queries";

export const GET = route(async () => ok({ rooms: listRooms((await requireUser()).id) }));
export const POST = route(async (req) => {
  const user = await requireUser();
  const b = RoomBody.parse(await jsonBody(req));
  return ok({ room: createRoom(user.id, b) }, 201);
});

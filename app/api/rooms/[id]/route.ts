import { ok, route, requireUser, jsonBody, ApiError } from "@/lib/api";
import { RoomBody } from "@/lib/validation";
import { deleteRoom, getRoom, listPlacements, updateRoom } from "@/lib/db/queries";

type Ctx = { params: Promise<{ id: string }> };
async function owned(ctx: Ctx) {
  const user = await requireUser();
  const room = getRoom((await ctx.params).id);
  if (!room) throw new ApiError(404, "not_found", "We couldn't find that room.");
  if (room.userId !== user.id) throw new ApiError(403, "forbidden", "That room belongs to someone else.");
  return room;
}
export const GET = route<Ctx>(async (_r, ctx) => { const room = await owned(ctx); return ok({ room, placements: listPlacements(room.id) }); });
export const PATCH = route<Ctx>(async (req, ctx) => {
  const room = await owned(ctx);
  return ok({ room: updateRoom(room.id, RoomBody.omit({ referenceSpaceId: true, measuredRoomId: true }).partial().parse(await jsonBody(req))) });
});
export const DELETE = route<Ctx>(async (_r, ctx) => { deleteRoom((await owned(ctx)).id); return ok({ ok: true }); });

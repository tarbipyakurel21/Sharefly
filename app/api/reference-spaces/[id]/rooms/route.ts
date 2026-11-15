import { ok, route, requireUser, ApiError } from "@/lib/api";
import { getReferenceSpaceProvider } from "@/lib/reference-spaces/provider";
import { measuredRoomsForSpace } from "@/lib/matterport/resolve";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Rooms of this space with usable Matterport measurements. Never an error for "no data": the person
 * falls back to the sq ft estimate, so `rooms` is simply empty and `reason` says why.
 */
export const GET = route<Ctx>(async (_req, ctx) => {
  await requireUser();
  const space = await getReferenceSpaceProvider().get((await ctx.params).id);
  if (!space) throw new ApiError(404, "space_not_found", "We couldn't find that apartment floor plan. Please pick another.");
  const r = await measuredRoomsForSpace(space.matterport);
  if (!r.ok) return ok({ rooms: [], reason: r.reason });
  return ok({ rooms: r.rooms, level: r.level, unusable: r.unusable, reason: null });
});

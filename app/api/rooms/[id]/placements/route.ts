import { ok, route, requireUser, jsonBody, ApiError } from "@/lib/api";
import { PlacementsBody } from "@/lib/validation";
import { getRoom, replacePlacements, getListing } from "@/lib/db/queries";

/** Last write wins: the whole layout is replaced. */
export const PUT = route<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const user = await requireUser();
  const room = getRoom((await ctx.params).id);
  if (!room) throw new ApiError(404, "not_found", "We couldn't find that room.");
  if (room.userId !== user.id) throw new ApiError(403, "forbidden", "That room belongs to someone else.");
  const { placements } = PlacementsBody.parse(await jsonBody(req));
  // A piece may only claim confirmed dimensions if the listing actually has them.
  const safe = placements.map((p) => {
    const l = p.listingId ? getListing(p.listingId) : null;
    if (p.listingId && !l) return { ...p, listingId: null };
    if (p.dimensionsConfirmed && l && l.widthM == null) return { ...p, dimensionsConfirmed: false };
    return p;
  });
  replacePlacements(room.id, safe);
  return ok({ ok: true, savedAt: new Date().toISOString() });
});

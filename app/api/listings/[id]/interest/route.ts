import { ok, route, requireUser, ApiError } from "@/lib/api";
import { addInterest, getListing, notify, firstName } from "@/lib/db/queries";

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const user = await requireUser();
  const l = await getListing((await ctx.params).id);
  if (!l) throw new ApiError(404, "not_found", "We couldn't find that item.");
  if (l.giverId === user.id) throw new ApiError(400, "own_listing", "This is your own listing.");
  if (l.status !== "available") throw new ApiError(409, "unavailable", "This item has already found a home.");
  if (await addInterest(l.id, user.id)) await notify(l.giverId, "interest", "Someone is interested", `${firstName(user.name)} would like ${l.title}.`, `/items/${l.id}`);
  return ok({ ok: true });
});

import { ok, route, requireUser, ApiError } from "@/lib/api";
import { createMeasurementRequest, getListing, notify, firstName } from "@/lib/db/queries";

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const user = await requireUser();
  const l = await getListing((await ctx.params).id);
  if (!l) throw new ApiError(404, "not_found", "We couldn't find that item.");
  if (l.giverId === user.id) throw new ApiError(400, "own_listing", "This is your own listing.");
  if (l.widthM != null) throw new ApiError(409, "has_size", "This item already has a size.");
  if (await createMeasurementRequest(l.id, user.id)) await notify(l.giverId, "measurement_request", "Someone asked for measurements", `${firstName(user.name)} wants to check whether ${l.title} will fit. Add its width, depth and height when you can.`, `/items/${l.id}`);
  return ok({ ok: true });
});

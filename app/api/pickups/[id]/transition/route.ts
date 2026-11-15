import { ok, route, requireUser, jsonBody, ApiError } from "@/lib/api";
import { PickupActionBody } from "@/lib/validation";
import { getPickup, notify, transitionPickupRow, firstName } from "@/lib/db/queries";
import { nextStatus, roleOf, TransitionError, type PickupAction } from "@/lib/pickups/state";

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const user = await requireUser();
  const p = await getPickup((await ctx.params).id);
  if (!p) throw new ApiError(404, "not_found", "We couldn't find that pickup.");
  const { action, contactNote } = PickupActionBody.parse(await jsonBody(req));
  const a = action as PickupAction;
  if (a === "offer" && p.listingStatus !== "available") throw new ApiError(409, "unavailable", "This item has already found a home.");
  let to;
  try { to = nextStatus(p.status, a, roleOf(user.id, p)); }
  catch (e) { if (e instanceof TransitionError) throw new ApiError(e.code === "forbidden" ? 403 : 409, e.code, e.message); throw e; }

  const driverPatch = a === "offer" ? user.id : a === "decline" || a === "withdraw" ? null : undefined;
  // Compare-and-set: if two drivers offer at once, only the first wins.
  if (!await transitionPickupRow(p.id, p.status, to, driverPatch, contactNote)) throw new ApiError(409, "taken", "Someone else just offered to help with this one.");

  const me = firstName(user.name), item = p.listingTitle;
  if (a === "offer") await notify(p.requesterId, "pickup", "A driver offered to help", `${me} can help with the pickup for ${item}.`, "/rideboard");
  if (a === "accept" && p.driverId) await notify(p.driverId, "pickup", "Your offer was accepted", `${me} accepted your help with ${item}.`, "/rideboard");
  if (a === "decline" && p.driverId) await notify(p.driverId, "pickup", "Offer declined", `${me} found another way for ${item}. Thanks for offering.`, "/rideboard");
  if (a === "withdraw") await notify(p.requesterId, "pickup", "A driver stepped back", `${me} can no longer help with ${item}. Your request is open again.`, "/rideboard");
  if (a === "complete") { const other = user.id === p.requesterId ? p.driverId : p.requesterId; if (other) await notify(other, "pickup", "Pickup completed", `${item} has been picked up.`, "/rideboard"); await notify(p.giverId, "pickup", "Pickup completed", `${item} was picked up. You can mark it as given away.`, `/items/${p.listingId}`); }
  if (a === "cancel" && p.driverId) await notify(p.driverId, "pickup", "Pickup cancelled", `${me} cancelled the pickup for ${item}.`, "/rideboard");
  return ok({ pickup: await getPickup(p.id) });
});

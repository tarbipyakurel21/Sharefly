import { ok, route, requireUser, jsonBody, ApiError, rateLimit } from "@/lib/api";
import { PickupBody } from "@/lib/validation";
import { activePickupForListing, createPickup, driversInNeighborhood, getListing, listOpenPickups, notify, firstName } from "@/lib/db/queries";

export const GET = route(async () => { await requireUser(); return ok({ pickups: listOpenPickups() }); });

export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`pickup:${user.id}`, 10, 60_000);
  const b = PickupBody.parse(await jsonBody(req));
  const l = getListing(b.listingId);
  if (!l) throw new ApiError(404, "not_found", "We couldn't find that item.");
  if (l.status !== "available") throw new ApiError(409, "unavailable", "This item has already found a home.");
  if (l.giverId === user.id) throw new ApiError(400, "own_listing", "This is your own listing.");
  const dup = activePickupForListing(l.id, user.id);
  if (dup) throw new ApiError(409, "duplicate", "You already have a pickup request for this item.");
  const from = b.fromNeighborhood || l.neighborhood || "To be arranged";
  const p = createPickup({ listingId: l.id, requesterId: user.id, fromNeighborhood: from, toNeighborhood: b.toNeighborhood, preferredWindow: b.preferredWindow, note: b.note });
  notify(l.giverId, "pickup", "Someone is arranging a pickup", `${firstName(user.name)} is asking for pickup help for ${l.title}.`, `/items/${l.id}`);
  for (const d of driversInNeighborhood(from)) if (d.userId !== user.id) notify(d.userId, "pickup_request", "A pickup near you needs a driver", `${l.title}: ${from} to ${b.toNeighborhood}.`, "/rideboard");
  return ok({ pickup: p }, 201);
});

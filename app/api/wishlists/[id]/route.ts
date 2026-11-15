import { ok, route, requireUser, jsonBody, ApiError } from "@/lib/api";
import { WishlistBody } from "@/lib/validation";
import { clearMatchesForWishlist, deleteWishlist, getWishlist, updateWishlist } from "@/lib/db/queries";
import { parseWishlistText } from "@/lib/matching/parse";
import { runMatchingForWishlist } from "@/lib/matching/run";
import { milesToKm } from "@/lib/geo/neighborhoods";

type Ctx = { params: Promise<{ id: string }> };
async function owned(ctx: Ctx) {
  const user = await requireUser();
  const wl = await getWishlist((await ctx.params).id);
  if (!wl) throw new ApiError(404, "not_found", "We couldn't find that wishlist.");
  if (wl.userId !== user.id) throw new ApiError(403, "forbidden", "That wishlist belongs to someone else.");
  return wl;
}

export const PATCH = route<Ctx>(async (req, ctx) => {
  const wl = await owned(ctx);
  const b = WishlistBody.partial().parse(await jsonBody(req));
  const patch: Parameters<typeof updateWishlist>[1] = {};
  if (b.rawText !== undefined) {
    const p = parseWishlistText(b.rawText);
    Object.assign(patch, { rawText: b.rawText, categories: p.categories, keywords: p.keywords, maxPriceCents: p.maxPriceCents, maxDistanceKm: p.maxDistanceKm });
  }
  if (b.maxPriceDollars !== undefined) patch.maxPriceCents = b.maxPriceDollars == null ? null : Math.round(b.maxPriceDollars * 100);
  if (b.maxDistanceMiles !== undefined) patch.maxDistanceKm = b.maxDistanceMiles == null ? null : Math.round(milesToKm(b.maxDistanceMiles) * 100) / 100;
  if (b.neighborhood !== undefined) patch.neighborhood = b.neighborhood;
  if (b.active !== undefined) patch.active = b.active;
  const updated = (await updateWishlist(wl.id, patch))!;
  // Editing re-runs matching: stale matches go, fresh ones are computed.
  await clearMatchesForWishlist(wl.id);
  let matched = 0;
  if (updated.active) { try { matched = (await runMatchingForWishlist(wl.id)).matched; } catch (e) { console.error("[matching]", e instanceof Error ? e.message : e); } }
  return ok({ wishlist: updated, matchCount: matched });
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const wl = await owned(ctx);
  await deleteWishlist(wl.id);
  return ok({ ok: true });
});

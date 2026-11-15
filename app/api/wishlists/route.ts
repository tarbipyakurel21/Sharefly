import { ok, route, requireUser, jsonBody } from "@/lib/api";
import { WishlistBody } from "@/lib/validation";
import { createWishlist, listWishlists, getUser } from "@/lib/db/queries";
import { parseWishlistText } from "@/lib/matching/parse";
import { runMatchingForWishlist } from "@/lib/matching/run";
import { milesToKm } from "@/lib/geo/neighborhoods";

export const GET = route(async () => ok({ wishlists: await listWishlists((await requireUser()).id) }));

export const POST = route(async (req) => {
  const user = await requireUser();
  const b = WishlistBody.parse(await jsonBody(req));
  const parsed = parseWishlistText(b.rawText);
  // Explicit controls override anything parsed from the text.
  const wl = await createWishlist(user.id, {
    rawText: b.rawText, categories: parsed.categories, keywords: parsed.keywords,
    maxPriceCents: b.maxPriceDollars != null ? Math.round(b.maxPriceDollars * 100) : parsed.maxPriceCents,
    maxDistanceKm: b.maxDistanceMiles != null ? Math.round(milesToKm(b.maxDistanceMiles) * 100) / 100 : parsed.maxDistanceKm,
    neighborhood: b.neighborhood ?? (await getUser(user.id))?.neighborhood ?? null,
  });
  let result = { matched: 0, created: 0 };
  try { result = await runMatchingForWishlist(wl.id); } catch (e) { console.error("[matching] wishlist", e instanceof Error ? e.message : e); }
  return ok({ wishlist: wl, matchCount: result.matched, understood: parsed.categories.length > 0 }, 201);
});

import { activeWishlists, allAvailableListings, getListing, getWishlist, notify, upsertMatch, firstName } from "@/lib/db/queries";
import { evaluate } from "./score";

/** A new or edited listing searches all active wishlists. Returns the number of matches (created or refreshed). */
export async function runMatchingForListing(listingId: string): Promise<{ matched: number; created: number }> {
  const listing = await getListing(listingId);
  if (!listing) return { matched: 0, created: 0 };
  let matched = 0, created = 0;
  for (const wl of await activeWishlists()) {
    const r = evaluate(listing, wl);
    if (!r) continue;
    matched++;
    if ((await upsertMatch(listing.id, wl.id, r.score, r.reasons)).created) {
      created++;
      await notify(wl.userId, "match", "Something you wanted just turned up", `${firstName(listing.giverName)} is giving away: ${listing.title}`, `/items/${listing.id}`);
    }
  }
  return { matched, created };
}

/** A new or edited wishlist searches all available listings. */
export async function runMatchingForWishlist(wishlistId: string): Promise<{ matched: number; created: number }> {
  const wl = await getWishlist(wishlistId);
  if (!wl) return { matched: 0, created: 0 };
  let matched = 0, created = 0;
  for (const listing of await allAvailableListings()) {
    const r = evaluate(listing, wl);
    if (!r) continue;
    matched++;
    if ((await upsertMatch(listing.id, wl.id, r.score, r.reasons)).created) {
      created++;
      await notify(wl.userId, "match", "We found something you wanted", `${listing.title} is available near you.`, `/items/${listing.id}`);
    }
  }
  return { matched, created };
}

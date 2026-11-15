import { ok, route, requireUser, jsonBody, rateLimit } from "@/lib/api";
import { ListingBody } from "@/lib/validation";
import { createListing, getListingByClientKey, listListings } from "@/lib/db/queries";
import { runMatchingForListing } from "@/lib/matching/run";
import { countMatchesForListing } from "@/lib/db/queries";

export const GET = route(async (req) => {
  const u = new URL(req.url).searchParams;
  return ok({
    listings: await listListings({ q: u.get("q") ?? undefined, category: u.get("category") ?? undefined, neighborhood: u.get("neighborhood") ?? undefined, freeOnly: u.get("free") === "1" }),
  });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`publish:${user.id}`, 20, 60_000);
  const b = ListingBody.parse(await jsonBody(req));
  // Idempotent: a double-tap on Publish returns the same listing.
  if (b.clientKey) {
    const existing = await getListingByClientKey(b.clientKey);
    if (existing && existing.giverId === user.id) return ok({ listing: existing, matchCount: await countMatchesForListing(existing.id) });
  }
  const listing = await createListing({
    giverId: user.id, title: b.title, description: b.description, category: b.category,
    conditionNote: b.conditionNote, purchasedFrom: b.purchasedFrom, neighborhood: b.neighborhood ?? user.neighborhood,
    widthM: b.widthM ?? null, depthM: b.depthM ?? null, heightM: b.heightM ?? null, aiGenerated: b.aiGenerated, clientKey: b.clientKey ?? null,
    model: b.model ?? null,
    photo: b.photoUrl ? { url: b.photoUrl, width: b.photoWidth, height: b.photoHeight } : null,
  });
  try { await runMatchingForListing(listing.id); } catch (e) { console.error("[matching] listing", e instanceof Error ? e.message : e); }
  return ok({ listing, matchCount: await countMatchesForListing(listing.id) }, 201);
});

import { describe, it, expect } from "vitest";
import { evaluate, type MatchListing, type MatchWishlist } from "@/lib/matching/score";
import { parseWishlistText } from "@/lib/matching/parse";
import { lookupNeighborhood } from "@/lib/geo/neighborhoods";

const now = new Date("2026-11-14T12:00:00Z");
const campus = lookupNeighborhood("USC / Exposition Park")!;
const downtown = lookupNeighborhood("Downtown Los Angeles")!;
const katy = lookupNeighborhood("Pasadena")!;

const listing = (o: Partial<MatchListing> = {}): MatchListing => ({
  id: "l1", giverId: "jordan", title: "Wooden desk", description: "A plain wooden desk with two drawers.",
  category: "desk", status: "available", priceCents: 0, lat: downtown.lat, lng: downtown.lng, publishedAt: now.toISOString(), ...o,
});
const wish = (text: string, o: Partial<MatchWishlist> = {}): MatchWishlist => {
  const i = parseWishlistText(text);
  return { id: "w1", userId: "maya", ...i, lat: campus.lat, lng: campus.lng, active: true, ...o };
};

describe("parseWishlistText", () => {
  it("parses the demo sentence", () => {
    const i = parseWishlistText("a desk for my bedroom, under $30, within 5 miles");
    expect(i.categories).toEqual(["desk"]);
    expect(i.maxPriceCents).toBe(3000);
    expect(i.maxDistanceKm).toBeCloseTo(8.05, 1);
    expect(i.keywords).toContain("desk");
  });
  it("handles km and synonyms", () => {
    const i = parseWishlistText("couch within 3 km");
    expect(i.categories).toEqual(["sofa"]);
    expect(i.maxDistanceKm).toBe(3);
    expect(i.maxPriceCents).toBeNull();
  });
  it("saves text with no recognizable item", () => {
    const i = parseWishlistText("something cozy");
    expect(i.categories).toEqual([]);
    expect(i.keywords).toContain("cozy");
  });
});

describe("evaluate", () => {
  it("desk listing matches desk wishlist with reasons", () => {
    const r = evaluate(listing(), wish("a desk for my bedroom, under $30, within 5 miles"), now)!;
    expect(r.score).toBeGreaterThanOrEqual(50);
    expect(r.reasons.join("|")).toMatch(/desk/);
    expect(r.reasons).toContain("Free, within your budget");
    expect(r.reasons).toContain("Just listed");
  });
  it("couch wishlist matches sofa listing", () => {
    const r = evaluate(listing({ title: "Grey sofa", description: "Three seat sofa", category: "sofa" }), wish("a couch"), now);
    expect(r).not.toBeNull();
  });
  it("over budget is excluded", () => {
    expect(evaluate(listing({ priceCents: 5000 }), wish("desk under $30"), now)).toBeNull();
  });
  it("out of range is excluded", () => {
    expect(evaluate(listing({ lat: katy.lat, lng: katy.lng }), wish("desk within 3 km"), now)).toBeNull();
  });
  it("unknown distance passes with half points and a reason", () => {
    const known = evaluate(listing({ lat: campus.lat, lng: campus.lng }), wish("desk"), now)!;
    const unknown = evaluate(listing({ lat: null, lng: null }), wish("desk"), now)!;
    expect(unknown.reasons.some((x) => /Distance unknown/.test(x))).toBe(true);
    expect(known.score - unknown.score).toBeGreaterThan(5);
  });
  it("own listing is excluded", () => {
    expect(evaluate(listing({ giverId: "maya" }), wish("desk"), now)).toBeNull();
  });
  it("unavailable listing or paused wishlist is excluded", () => {
    expect(evaluate(listing({ status: "claimed" }), wish("desk"), now)).toBeNull();
    expect(evaluate(listing(), wish("desk", { active: false }), now)).toBeNull();
  });
  it("no overlap is excluded", () => {
    expect(evaluate(listing({ title: "Toaster", description: "A toaster", category: "appliance" }), wish("desk"), now)).toBeNull();
  });
  it("is deterministic (no duplicates by construction)", () => {
    const a = evaluate(listing(), wish("desk"), now), b = evaluate(listing(), wish("desk"), now);
    expect(a).toEqual(b);
  });
});

import { categoriesIn } from "@/lib/matching/text";
describe("dressing furniture words", () => {
  it("understands a dressing table or vanity as a table, and a dressing chair as a chair", () => {
    expect(categoriesIn("a dressing table for my room")).toEqual(["table"]);
    expect(categoriesIn("vanity")).toEqual(["table"]);
    expect(categoriesIn("a dressing chair")).toEqual(["chair"]);
  });
});

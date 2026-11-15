import { describe, expect, it, vi } from "vitest";
import { buildAtlasFilter, fromAtlasDoc, toAtlasDoc } from "@/lib/reference-spaces/atlas-doc";
import { matchesFilters } from "@/lib/reference-spaces/filter";
import { AtlasReferenceSpaceProvider } from "@/lib/reference-spaces/atlas";
import { NullReferenceSpaceProvider, ReferenceSpaceUnavailable, type ReferenceSpaceProvider } from "@/lib/reference-spaces/base";
import { CURATED_SPACES } from "@/lib/reference-spaces/curated";
import type { ReferenceSpace } from "@/lib/reference-spaces/types";

const space: ReferenceSpace = {
  id: "costar-1-2", propertyId: 1, floorPlanId: 2, communityName: "Fixture Flats", floorPlanName: "1x1", city: "Houston", state: "TX", lat: 29.76, lng: -95.37,
  beds: 1, baths: 1, minSqft: 700, maxSqft: 700, minRentUsd: 1000, maxRentUsd: 1200, rentBasis: "unit", unitsAvailable: 3, lifestyle: "student",
  colleges: [{ name: "Fixture University", campus: null, feetToCampus: 900 }], photoUrl: "https://example.com/p.jpg", matterport: { community: ["COMM0001"], floorPlan: [], unit: [] }, units: [],
};

describe("Atlas documents", () => {
  it("store only what the feature needs", () => {
    const d = toAtlasDoc(space) as Record<string, unknown>;
    for (const dropped of ["photoUrl", "unitsAvailable", "propertyId", "floorPlanId", "id", "lat", "lng"]) expect(d).not.toHaveProperty(dropped);
    expect(d._id).toBe("costar-1-2");
    expect(d.loc).toEqual({ type: "Point", coordinates: [-95.37, 29.76] });
  });
  it("round-trip to a valid space, with nulls where data was left out", () => {
    expect(fromAtlasDoc(toAtlasDoc(space))).toEqual({ ...space, propertyId: null, floorPlanId: null, unitsAvailable: null, photoUrl: null });
  });
  it("omit loc when there are no coordinates and read back null coordinates", () => {
    const d = toAtlasDoc(CURATED_SPACES[0]);
    expect(d.loc).toBeUndefined();
    expect(fromAtlasDoc(d)).toMatchObject({ lat: null, lng: null });
  });
  it("reject malformed documents instead of throwing", () => { expect(fromAtlasDoc({ _id: "x" })).toBeNull(); expect(fromAtlasDoc(null)).toBeNull(); });
});

describe("Atlas filter", () => {
  it("is empty without filters", () => { expect(buildAtlasFilter({})).toEqual({}); });
  it("maps each filter the way the JSON store reads it", () => {
    const q = buildAtlasFilter({ city: "houston", beds: 4, maxRent: 1500, lifestyle: "student", nearCollege: "true" });
    expect(q).toMatchObject({ beds: { $gte: 4 }, minRentUsd: { $lte: 1500 }, lifestyle: "student", "colleges.0": { $exists: true } });
    expect(buildAtlasFilter({ beds: 0 })).toEqual({ beds: 0 });
    expect(matchesFilters(space, { city: "houston", beds: 1, maxRent: 1500 })).toBe(true); // JSON semantics for the same inputs
  });
  it("escapes regex characters in free text and city", () => {
    const q = buildAtlasFilter({ q: "a.b(c)", city: "St. Louis" }) as { city: { $regex: string }; $and: { $or: { communityName: { $regex: string } }[] }[] };
    expect(q.city.$regex).toBe("^St\\. Louis$");
    expect(q.$and[0].$or[0].communityName.$regex).toBe("a\\.b\\(c\\)");
  });
  it("uses a geo radius only when both coordinates are given", () => {
    expect(buildAtlasFilter({ lat: 29.7 })).toEqual({});
    expect(buildAtlasFilter({ lat: 29.7, lng: -95.3, radiusKm: 10 })).toHaveProperty("loc.$geoWithin.$centerSphere");
  });
});

function fakeCollection(opts: { docs?: unknown[]; total?: number; fail?: boolean }) {
  const find = vi.fn(() => { if (opts.fail) throw new Error("down"); return { sort: () => ({ limit: () => ({ toArray: async () => opts.docs ?? [] }) }) }; });
  return { find, countDocuments: async () => { if (opts.fail) throw new Error("down"); return opts.total ?? 0; }, findOne: async () => { if (opts.fail) throw new Error("down"); return (opts.docs ?? [])[0] ?? null; } } as never;
}
const json: ReferenceSpaceProvider = {
  isAvailable: () => true, health: async () => ({ provider: "costar", store: "json", available: true, count: 1 }),
  search: async () => ({ spaces: [space], total: 1 }), get: async () => space,
};

describe("Atlas provider", () => {
  it("reads from Atlas and puts curated matches first", async () => {
    const p = new AtlasReferenceSpaceProvider(new NullReferenceSpaceProvider(), () => fakeCollection({ docs: [toAtlasDoc(space)], total: 40 }));
    const r = await p.search({ city: "Princeton" });
    expect(r.total).toBe(41);
    expect(r.spaces.map((s) => s.id)).toEqual([CURATED_SPACES[0].id, "costar-1-2"]);
  });
  it("falls back to the JSON store when Atlas fails", async () => {
    const p = new AtlasReferenceSpaceProvider(json, () => fakeCollection({ fail: true }));
    expect((await p.search({})).spaces[0].id).toBe("costar-1-2");
    expect((await p.get("costar-1-2"))?.id).toBe("costar-1-2");
    expect((await p.health()).note).toMatch(/unreachable/);
  });
  it("reports unavailable when Atlas fails and there is no fallback", async () => {
    const p = new AtlasReferenceSpaceProvider(new NullReferenceSpaceProvider(), () => fakeCollection({ fail: true }));
    await expect(p.search({})).rejects.toBeInstanceOf(ReferenceSpaceUnavailable);
    await expect(p.get("nope")).rejects.toBeInstanceOf(ReferenceSpaceUnavailable);
  });
  it("serves curated spaces by id without touching Atlas", async () => {
    const p = new AtlasReferenceSpaceProvider(new NullReferenceSpaceProvider(), () => { throw new Error("must not connect"); });
    expect((await p.get(CURATED_SPACES[0].id))?.id).toBe(CURATED_SPACES[0].id);
  });
});

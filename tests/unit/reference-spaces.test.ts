import { describe, it, expect } from "vitest";
import { buildReferenceSpaces, decodeLifestyle, matterportIds, rentOrNull, type KitListing, type KitProperty } from "@/lib/reference-spaces/transform";
import { estimateRoom } from "@/lib/reference-spaces/estimate";
import { searchSpaces } from "@/lib/reference-spaces/filter";
import { rentLabel } from "@/lib/reference-spaces/format";
import { ReferenceSpaceSchema, SearchFiltersSchema } from "@/lib/reference-spaces/types";
import { ROOM_LIMITS } from "@/lib/room/defaults";

const enums = { ApartmentLifestyleType: { "0": "Unknown", "1": "All", "3": "Student" } };
const listing = (o: Partial<KitListing> = {}): KitListing => ({
  propertyId: 7, buildingName: " Test Place ", lifestyleType: 3,
  address: { city: "Houston", state: "TX", latitude: 29.7, longitude: -95.3 }, primaryPhoto: { attachmentUri: "https://example.com/112/a.jpg" },
  apartmentModels: [{ id: 70, name: "1x1", numBeds: 1, numBaths: 1, minSquareFeet: 700, maxSquareFeet: 720, minRent: 0, maxRent: 0, rentPricingType: 1, numUnitsAvailable: 3 }], ...o,
});
const prop = (o: Partial<KitProperty> = {}): KitProperty => ({
  id: 7, attachments: [{ videoKey: "AAA", videoExternalReferenceType: 36 }, { videoKey: "STILL", videoExternalReferenceType: 0 }, { videoKey: "BBB", videoExternalReferenceType: 234 }],
  propertyApartment: { residentialProfile: { colleges: [{ collegeName: "Far U", feetToCampusBoundary: 9000 }, { collegeName: "Near U", campusName: "Main", feetToCampusBoundary: 800 }] }, models: [{ id: 70, attachments: [{ videoKey: "FP1", videoExternalReferenceType: 36 }], units: [{ attachments: [{ videoKey: "U1", videoExternalReferenceType: 234 }] }] }] }, ...o,
});

describe("kit transforms", () => {
  it("treats rent 0 as not provided", () => { expect(rentOrNull(0)).toBeNull(); expect(rentOrNull(null)).toBeNull(); expect(rentOrNull(950)).toBe(950); });
  it("keeps only Matterport attachment types 36 and 234", () => { expect(matterportIds(prop().attachments)).toEqual(["AAA", "BBB"]); });
  it("decodes lifestyle through the enum table", () => { expect(decodeLifestyle(3, enums)).toBe("student"); expect(decodeLifestyle(0, enums)).toBe("unknown"); expect(decodeLifestyle(99, enums)).toBe("unknown"); });
  it("builds a valid space joined by floor plan id", () => {
    const { spaces, skipped } = buildReferenceSpaces(listing(), prop(), enums);
    expect(skipped).toEqual([]);
    const s = spaces[0];
    expect(ReferenceSpaceSchema.safeParse(s).success).toBe(true);
    expect(s).toMatchObject({ id: "costar-7-70", communityName: "Test Place", minRentUsd: null, maxRentUsd: null, rentBasis: null, lifestyle: "student", minSqft: 700 });
    expect(s.matterport).toEqual({ community: ["AAA", "BBB"], floorPlan: ["FP1"], unit: ["U1"] });
    expect(s.colleges.map((c) => c.name)).toEqual(["Near U", "Far U"]);
  });
  it("skips with a reason instead of guessing", () => {
    expect(buildReferenceSpaces(listing(), undefined, enums).skipped[0].reason).toBe("no_property_record");
    expect(buildReferenceSpaces(listing({ address: { city: "X", state: "TX" } }), prop(), enums).skipped[0].reason).toBe("no_coordinates");
    const noSize = listing({ apartmentModels: [{ id: 1, numBeds: 1, minSquareFeet: 0, maxSquareFeet: null }] });
    expect(buildReferenceSpaces(noSize, prop(), enums).skipped[0].reason).toBe("no_floor_plan_size");
  });
});

describe("estimateRoom", () => {
  it("is deterministic and documented: studio 80%, 1 bed 40%", () => {
    const studio = estimateRoom(500, 0), one = estimateRoom(500, 1);
    expect(studio.mainRoomM2).toBeCloseTo(500 * 0.092903 * 0.8, 1);
    expect(one.mainRoomM2).toBeCloseTo(500 * 0.092903 * 0.4, 1);
    expect(studio.lengthM / studio.widthM).toBeCloseTo(1.25, 1);
    expect(studio.heightM).toBe(2.44);
  });
  it("stays inside room limits", () => {
    const tiny = estimateRoom(10, 0), huge = estimateRoom(500000, 0);
    expect(tiny.widthM).toBeGreaterThanOrEqual(ROOM_LIMITS.minLW);
    expect(huge.lengthM).toBeLessThanOrEqual(ROOM_LIMITS.maxLW);
  });
});

describe("searchSpaces", () => {
  const mk = (id: string, o: object) => ReferenceSpaceSchema.parse({ id, propertyId: 1, floorPlanId: 1, communityName: id, floorPlanName: null, city: "Houston", state: "TX", lat: 29.7, lng: -95.3, beds: 1, baths: 1, minSqft: 600, maxSqft: 600, minRentUsd: 1000, maxRentUsd: 1000, rentBasis: "unit", unitsAvailable: 1, lifestyle: "all", colleges: [], photoUrl: null, matterport: { community: [], floorPlan: [], unit: [] }, ...o });
  const all = [mk("a", {}), mk("b", { city: "Los Angeles", lat: 34.05, lng: -118.25, beds: 3, minRentUsd: 2500 }), mk("c", { minRentUsd: null, maxRentUsd: null, rentBasis: null }), mk("d", { colleges: [{ name: "Rice", campus: null, feetToCampus: 500 }], lifestyle: "student" })];
  it("filters by city, beds and rent, and never treats unknown rent as cheap", () => {
    expect(searchSpaces(all, { city: "los angeles" }).spaces.map((s) => s.id)).toEqual(["b"]);
    expect(searchSpaces(all, { beds: 3 }).total).toBe(1);
    expect(searchSpaces(all, { beds: 4 }).total).toBe(0);
    expect(searchSpaces(all, { maxRent: 1500 }).spaces.map((s) => s.id)).toEqual(["a", "d"]);
  });
  it("finds student housing and college names", () => {
    expect(searchSpaces(all, { nearCollege: "true" }).spaces.map((s) => s.id)).toEqual(["d"]);
    expect(searchSpaces(all, { q: "rice" }).total).toBe(1);
  });
  it("filters by distance", () => {
    expect(searchSpaces(all, { lat: 29.7, lng: -95.3, radiusKm: 5 }).total).toBe(3);
  });
});

describe("api inputs and labels", () => {
  it("rejects out-of-range filters", () => { expect(SearchFiltersSchema.safeParse({ beds: "9" }).success).toBe(false); expect(SearchFiltersSchema.safeParse({ limit: "500" }).success).toBe(false); });
  it("says 'not provided' for unknown rent", () => { expect(rentLabel({ minRentUsd: null, maxRentUsd: null, rentBasis: null })).toBe("Rent not provided"); });
  it("labels per-bed rent", () => { expect(rentLabel({ minRentUsd: 700, maxRentUsd: 900, rentBasis: "bed" })).toContain("per bed"); });
});

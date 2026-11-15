import type { ReferenceSpace } from "./types";

/**
 * Hand-curated spaces that are not in the CoStar listing data. They go through the same provider, tour panel and
 * Model API path as imported spaces. Only add a space here if its Matterport id was published openly.
 * Rabinowitz Hall's model id was posted publicly by CoStar for the hackathon; no other kit id may appear in this repo.
 * Unknown facts stay null ("not provided"); nothing is guessed.
 */
export const CURATED_SPACES: ReferenceSpace[] = [
  {
    id: "curated-princeton-rabinowitz-hall",
    propertyId: null, floorPlanId: null,
    communityName: "Rabinowitz Hall", floorPlanName: null,
    city: "Princeton", state: "NJ", lat: null, lng: null,
    beds: null, baths: null, minSqft: null, maxSqft: null,
    minRentUsd: null, maxRentUsd: null, rentBasis: null, unitsAvailable: null,
    lifestyle: "unknown",
    colleges: [{ name: "Princeton University", campus: null, feetToCampus: null }],
    photoUrl: null,
    matterport: { community: ["2K7G7cdukZV"], floorPlan: [], unit: [] },
    units: [],
  },
];

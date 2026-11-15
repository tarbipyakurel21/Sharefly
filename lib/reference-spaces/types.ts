import { z } from "zod";

/** One compact record per apartment floor plan. Built from the CoStar kit by scripts/import-costar.ts. */
export const LIFESTYLES = ["all", "senior", "student", "military", "corporate", "vacation", "unknown"] as const;
export type Lifestyle = (typeof LIFESTYLES)[number];

const MatterportIds = z.object({
  community: z.array(z.string().min(1)),
  floorPlan: z.array(z.string().min(1)),
  unit: z.array(z.string().min(1)),
});

export const ReferenceSpaceSchema = z.object({
  id: z.string().min(1),
  propertyId: z.number().int(),
  floorPlanId: z.number().int(),
  communityName: z.string().nullable(),
  floorPlanName: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  beds: z.number().int().min(0).max(20).nullable(),
  baths: z.number().min(0).max(20).nullable(),
  minSqft: z.number().int().positive().nullable(),
  maxSqft: z.number().int().positive().nullable(),
  /** Monthly dollars. null = not provided (the kit uses 0 for "no rent given"). */
  minRentUsd: z.number().int().positive().nullable(),
  maxRentUsd: z.number().int().positive().nullable(),
  /** What the rent is priced by. "bed" means per bed (student housing), not per unit. */
  rentBasis: z.enum(["unit", "bed", "bedroom"]).nullable(),
  unitsAvailable: z.number().int().min(0).nullable(),
  lifestyle: z.enum(LIFESTYLES),
  colleges: z.array(z.object({ name: z.string().min(1), campus: z.string().nullable(), feetToCampus: z.number().min(0).nullable() })).max(5),
  photoUrl: z.string().url().nullable(),
  matterport: MatterportIds,
});
export type ReferenceSpace = z.infer<typeof ReferenceSpaceSchema>;

/** Snapshot stored on a room so it keeps its source even if the dataset changes or is absent. */
export const RoomSourceSchema = z.object({
  kind: z.literal("costar"),
  spaceId: z.string(),
  communityName: z.string().nullable(),
  floorPlanName: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  beds: z.number().nullable(),
  baths: z.number().nullable(),
  sqft: z.number().nullable(),
  estimated: z.literal(true),
  matterport: MatterportIds,
});
export type RoomSource = z.infer<typeof RoomSourceSchema>;

export const SearchFiltersSchema = z.object({
  q: z.string().trim().max(60).optional(),
  city: z.string().trim().max(60).optional(),
  /** 0 = studio; 4 means "4 or more". */
  beds: z.coerce.number().int().min(0).max(4).optional(),
  maxRent: z.coerce.number().int().min(1).max(20000).optional(),
  lifestyle: z.enum(LIFESTYLES).optional(),
  nearCollege: z.enum(["true", "false"]).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.5).max(100).default(10),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

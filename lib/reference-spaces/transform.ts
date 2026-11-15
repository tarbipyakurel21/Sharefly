import { ReferenceSpaceSchema, LIFESTYLES, type Lifestyle, type ReferenceSpace } from "./types";

/** Subset of the kit's apartment-listing and commercial-property records that we read. Everything may be missing. */
type Attachment = { videoKey?: string | null; videoExternalReferenceType?: number | null };
type College = { collegeName?: string | null; campusName?: string | null; feetToCampusBoundary?: number | null };
export type KitListing = {
  propertyId?: number | null; buildingName?: string | null; lifestyleType?: number | null;
  address?: { city?: string | null; state?: string | null; latitude?: number | null; longitude?: number | null } | null;
  primaryPhoto?: { attachmentUri?: string | null } | null;
  apartmentModels?: KitFloorPlan[] | null;
};
export type KitFloorPlan = {
  id?: number | null; name?: string | null; numBeds?: number | null; numBaths?: number | null;
  numUnitsAvailable?: number | null; minSquareFeet?: number | null; maxSquareFeet?: number | null;
  minRent?: number | null; maxRent?: number | null; rentPricingType?: number | null;
};
export type KitProperty = {
  id?: number; attachments?: Attachment[] | null;
  propertyApartment?: {
    residentialProfile?: { colleges?: College[] | null } | null;
    models?: { id?: number; attachments?: Attachment[] | null; units?: { unitNumber?: string | number | null; squareFeet?: number | null; sqft?: number | null; attachments?: Attachment[] | null }[] | null }[] | null;
  } | null;
};
/** Enum lookups from schemas/enums.json: value -> name. */
export type Enums = { ApartmentLifestyleType?: Record<string, string> };

export type SkipReason = "no_property_record" | "no_coordinates" | "no_city_or_state" | "no_floor_plan_size" | "invalid_record";

const MATTERPORT_TYPES = new Set([36, 234]); // MatterportScan, MatterportStreamingKey

export function matterportIds(attachments: Attachment[] | null | undefined): string[] {
  const out = new Set<string>();
  for (const a of attachments ?? []) {
    if (a && MATTERPORT_TYPES.has(a.videoExternalReferenceType ?? -1) && typeof a.videoKey === "string" && a.videoKey.trim()) out.add(a.videoKey.trim());
  }
  return [...out];
}

/** The kit stores "no rent given" as 0. We store null and show "not provided". */
export function rentOrNull(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
}
const posIntOrNull = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null);

export function decodeLifestyle(code: number | null | undefined, enums: Enums): Lifestyle {
  const name = enums.ApartmentLifestyleType?.[String(code ?? 0)]?.toLowerCase();
  return (LIFESTYLES as readonly string[]).includes(name ?? "") && name !== "unknown" ? (name as Lifestyle) : "unknown";
}

export function rentBasis(code: number | null | undefined): "unit" | "bed" | "bedroom" | null {
  return code === 1 ? "unit" : code === 2 ? "bed" : code === 3 ? "bedroom" : null;
}

function collegesOf(p: KitProperty) {
  const list = (p.propertyApartment?.residentialProfile?.colleges ?? []).filter((c) => c?.collegeName?.trim());
  return list
    .map((c) => ({ name: c.collegeName!.trim(), campus: c.campusName?.trim() || null, feetToCampus: typeof c.feetToCampusBoundary === "number" && c.feetToCampusBoundary >= 0 ? Math.round(c.feetToCampusBoundary) : null }))
    .sort((a, b) => (a.feetToCampus ?? Infinity) - (b.feetToCampus ?? Infinity))
    .slice(0, 5);
}

export type BuildResult = { spaces: ReferenceSpace[]; skipped: { reason: SkipReason; propertyId: number | null; floorPlanId: number | null }[] };

/** One reference space per floor plan of one community. Pure: no I/O. */
export function buildReferenceSpaces(listing: KitListing, property: KitProperty | undefined, enums: Enums): BuildResult {
  const spaces: ReferenceSpace[] = [];
  const skipped: BuildResult["skipped"] = [];
  const pid = listing.propertyId ?? null;
  const plans = listing.apartmentModels ?? [];
  const skipAll = (reason: SkipReason) => { for (const m of plans) skipped.push({ reason, propertyId: pid, floorPlanId: m.id ?? null }); };
  if (!property || pid == null) { skipAll("no_property_record"); return { spaces, skipped }; }
  const a = listing.address;
  if (typeof a?.latitude !== "number" || typeof a?.longitude !== "number") { skipAll("no_coordinates"); return { spaces, skipped }; }
  if (!a.city?.trim() || !a.state?.trim()) { skipAll("no_city_or_state"); return { spaces, skipped }; }

  const community = matterportIds(property.attachments);
  const colleges = collegesOf(property);
  const modelsById = new Map((property.propertyApartment?.models ?? []).map((m) => [m.id, m]));
  const lifestyle = decodeLifestyle(listing.lifestyleType, enums);

  for (const m of plans) {
    const minSqft = posIntOrNull(m.minSquareFeet), maxSqft = posIntOrNull(m.maxSquareFeet);
    if (minSqft == null && maxSqft == null) { skipped.push({ reason: "no_floor_plan_size", propertyId: pid, floorPlanId: m.id ?? null }); continue; }
    const pm = modelsById.get(m.id ?? -1);
    const unit = new Set<string>();
    for (const u of pm?.units ?? []) for (const id of matterportIds(u.attachments)) unit.add(id);
    const units = (pm?.units ?? []).flatMap((u) => {
      const number = u.unitNumber == null ? null : String(u.unitNumber).trim();
      if (!number) return [];
      return [{ number, sqft: posIntOrNull(u.squareFeet ?? u.sqft), matterport: matterportIds(u.attachments) }];
    }).slice(0, 500);
    const candidate = {
      id: `costar-${pid}-${m.id}`, propertyId: pid, floorPlanId: m.id,
      communityName: listing.buildingName?.trim() || null, floorPlanName: m.name?.trim() || null,
      city: a.city.trim(), state: a.state.trim(), lat: a.latitude, lng: a.longitude,
      beds: typeof m.numBeds === "number" ? m.numBeds : null, baths: typeof m.numBaths === "number" ? m.numBaths : null,
      minSqft: minSqft ?? maxSqft, maxSqft: maxSqft ?? minSqft,
      minRentUsd: rentOrNull(m.minRent), maxRentUsd: rentOrNull(m.maxRent) ?? rentOrNull(m.minRent),
      rentBasis: rentOrNull(m.minRent) || rentOrNull(m.maxRent) ? rentBasis(m.rentPricingType) : null,
      unitsAvailable: typeof m.numUnitsAvailable === "number" && m.numUnitsAvailable >= 0 ? m.numUnitsAvailable : null,
      lifestyle, colleges,
      photoUrl: listing.primaryPhoto?.attachmentUri?.trim() || null,
      matterport: { community, floorPlan: matterportIds(pm?.attachments), unit: [...unit].slice(0, 10) },
      units,
    };
    const parsed = ReferenceSpaceSchema.safeParse(candidate);
    if (parsed.success) spaces.push(parsed.data);
    else skipped.push({ reason: "invalid_record", propertyId: pid, floorPlanId: m.id ?? null });
  }
  return { spaces, skipped };
}

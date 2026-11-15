/** Matterport tour helpers. Pure and client-safe: no secrets here. */
export type TourLevel = "unit" | "floorPlan" | "community";
export type TourCandidate = { level: TourLevel; modelId: string };
export type MatterportIdSet = { unit: string[]; floorPlan: string[]; community: string[] };

/** Matterport model ids are short alphanumeric strings. Anything else is never put in a URL. */
const MODEL_ID = /^[A-Za-z0-9]{6,24}$/;
export const isModelId = (v: string) => MODEL_ID.test(v);

/** The embed URL confirmed by CoStar staff. */
export const embedUrl = (modelId: string) => `https://my.matterport.com/show/?m=${encodeURIComponent(modelId)}`;

export const LEVEL_LABEL: Record<TourLevel, string> = {
  unit: "This exact unit",
  floorPlan: "This floor plan",
  community: "The community (may not be this unit)",
};

/** Most specific first: unit, then floor plan, then community. Invalid and repeated ids are dropped. */
export function tourCandidates(ids: MatterportIdSet): TourCandidate[] {
  const out: TourCandidate[] = [];
  const seen = new Set<string>();
  for (const level of ["unit", "floorPlan", "community"] as const) {
    for (const modelId of ids[level]) {
      if (!isModelId(modelId) || seen.has(modelId)) continue;
      seen.add(modelId);
      out.push({ level, modelId });
    }
  }
  return out;
}

import { ok, route, requireUser, jsonBody, ApiError } from "@/lib/api";
import { ListingPatch } from "@/lib/validation";
import { getListing, updateListing, openMeasurementRequesters, answerMeasurementRequests, confirmPlacementsForListing, notify } from "@/lib/db/queries";
import { runMatchingForListing } from "@/lib/matching/run";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, ctx) => {
  const l = getListing((await ctx.params).id);
  if (!l) throw new ApiError(404, "not_found", "We couldn't find that item.");
  return ok({ listing: l });
});

export const PATCH = route<Ctx>(async (req, ctx) => {
  const user = await requireUser();
  const id = (await ctx.params).id;
  const l = getListing(id);
  if (!l) throw new ApiError(404, "not_found", "We couldn't find that item.");
  if (l.giverId !== user.id) throw new ApiError(403, "forbidden", "Only the person giving this away can change it.");
  const patch = ListingPatch.parse(await jsonBody(req));
  const dimsTouched = patch.widthM !== undefined || patch.depthM !== undefined || patch.heightM !== undefined;
  if (dimsTouched) {
    const w = patch.widthM ?? l.widthM, d = patch.depthM ?? l.depthM, h = patch.heightM ?? l.heightM;
    if (w == null || d == null || h == null) throw new ApiError(400, "invalid_input", "Please give width, depth and height together.");
    patch.widthM = w; patch.depthM = d; patch.heightM = h;
  }
  const updated = updateListing(id, patch)!;
  if (dimsTouched && updated.widthM != null && updated.depthM != null && updated.heightM != null) {
    confirmPlacementsForListing(id, updated.widthM, updated.depthM, updated.heightM);
    for (const rid of openMeasurementRequesters(id)) notify(rid, "measurements", "Measurements added", `${updated.title} now has a size, so you can check it fits.`, `/items/${id}`);
    answerMeasurementRequests(id);
  }
  try { if (updated.status === "available") runMatchingForListing(id); } catch (e) { console.error("[matching]", e instanceof Error ? e.message : e); }
  return ok({ listing: updated });
});

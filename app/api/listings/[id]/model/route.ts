import { ok, route, requireUser, rateLimit, ApiError } from "@/lib/api";
import { getListing, setListingModel } from "@/lib/db/queries";
import { getStorage, sniffModel, MAX_MODEL_BYTES } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

async function ownListing(ctx: Ctx) {
  const user = await requireUser();
  const l = await getListing((await ctx.params).id);
  if (!l) throw new ApiError(404, "not_found", "We couldn't find that item.");
  if (l.giverId !== user.id) throw new ApiError(403, "forbidden", "Only the person giving this away can change it.");
  return { user, l };
}

/** Attach the owner's own 3D scan (.usdz from Reality Composer, or .glb). Validated by magic bytes and size. */
export const POST = route<Ctx>(async (req, ctx) => {
  const { user, l } = await ownListing(ctx);
  rateLimit(`model:${user.id}`, 6, 60_000);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "no_file", "Please choose a 3D scan file.");
  if (file.size > MAX_MODEL_BYTES) throw new ApiError(413, "too_big", "That scan is too big. Try exporting a smaller one (under 30 MB).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffModel(bytes);
  if (!kind) throw new ApiError(415, "bad_type", "We can only use .usdz or .glb 3D scans.");
  const { url } = await getStorage().save(bytes, kind.ext);
  return ok({ listing: await setListingModel(l.id, { url, format: kind.ext }) });
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { l } = await ownListing(ctx);
  return ok({ listing: await setListingModel(l.id, null) });
});

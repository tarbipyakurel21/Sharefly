import { ok, route, ApiError, rateLimit, requireUser } from "@/lib/api";
import { getStorage, sniffModel, MAX_MODEL_BYTES } from "@/lib/storage";

/** A 3D model of the item (.usdz from Reality Composer, or .glb) added while creating a listing. Checked by magic bytes and size. */
export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`upload-model:${user.id}`, 6, 60_000);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "no_file", "Please choose a 3D model file.");
  if (file.size > MAX_MODEL_BYTES) throw new ApiError(413, "too_big", "That 3D model is too big. Try exporting a smaller one (under 30 MB).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffModel(bytes);
  if (!kind) throw new ApiError(415, "bad_type", "We can only use .usdz or .glb 3D models.");
  const { url } = await getStorage().save(bytes, kind.ext);
  return ok({ url, format: kind.ext });
});

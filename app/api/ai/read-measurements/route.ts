import { ok, route, ApiError, rateLimit, requireUser } from "@/lib/api";
import { getAIProvider } from "@/lib/ai/providers";
import { popularMeasurementLabels } from "@/lib/db/queries";
import { sniffImage, MAX_UPLOAD_BYTES } from "@/lib/storage";

/** Reads sizes printed in a screenshot. The result only pre-fills the form; the owner confirms before anything is saved. */
export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`ai-measure:${user.id}`, 10, 60_000);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "no_file", "Please choose a screenshot.");
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "too_big", "That image is too big.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) throw new ApiError(415, "bad_type", "We can only use JPEG, PNG or WebP images.");
  return ok(await getAIProvider().readMeasurements({ imageBytes: bytes, mimeType: type.mime, knownLabels: await popularMeasurementLabels() }));
});

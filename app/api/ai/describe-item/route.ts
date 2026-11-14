import { ok, route, ApiError, rateLimit } from "@/lib/api";
import { getAIProvider } from "@/lib/ai/providers";
import { sniffImage, MAX_UPLOAD_BYTES } from "@/lib/storage";

export const POST = route(async (req) => {
  rateLimit(`ai:${req.headers.get("x-forwarded-for") ?? "local"}`, 20, 60_000);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "no_file", "Please choose a photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "too_big", "That photo is too big.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) throw new ApiError(415, "bad_type", "We can only use JPEG, PNG or WebP photos.");
  const provider = getAIProvider();
  const result = await provider.describeItem({ imageBytes: bytes, mimeType: type.mime, fileName: String(form?.get("fileName") ?? file.name) });
  // `source` lets the UI avoid claiming a model looked at the photo when the mock is active.
  return ok(result);
});

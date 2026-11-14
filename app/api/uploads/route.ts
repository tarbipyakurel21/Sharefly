import { ok, route, ApiError, rateLimit } from "@/lib/api";
import { getStorage, sniffImage, MAX_UPLOAD_BYTES } from "@/lib/storage";

export const POST = route(async (req) => {
  rateLimit(`upload:${req.headers.get("x-forwarded-for") ?? "local"}`, 30, 60_000);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "no_file", "Please choose a photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "too_big", "That photo is too big. Try a smaller one (under 10 MB).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!sniffImage(bytes)) throw new ApiError(415, "bad_type", "We can only use JPEG, PNG or WebP photos.");
  const { url } = await getStorage().save(bytes, sniffImage(bytes)!.ext);
  return ok({ url });
});

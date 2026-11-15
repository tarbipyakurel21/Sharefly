import { ok, route, ApiError, rateLimit, requireUser } from "@/lib/api";
import { getStorage, sniffVideo, MAX_VIDEO_BYTES } from "@/lib/storage";

/** A short video of the item (optional on a listing). Checked by magic bytes and size before it is stored. */
export const POST = route(async (req) => {
  const user = await requireUser();
  rateLimit(`upload-video:${user.id}`, 6, 60_000);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "no_file", "Please choose a video.");
  if (file.size > MAX_VIDEO_BYTES) throw new ApiError(413, "too_big", "That video is too big. Try a shorter clip (under 30 MB).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffVideo(bytes);
  if (!kind) throw new ApiError(415, "bad_type", "We can only use MP4, MOV or WebM videos.");
  const { url } = await getStorage().save(bytes, kind.ext);
  return ok({ url });
});

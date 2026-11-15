import { z } from "zod";
import { ok, route, requireUser, jsonBody, ApiError } from "@/lib/api";
import { matchOwner, setMatchStatus } from "@/lib/db/queries";

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const user = await requireUser();
  const id = (await ctx.params).id;
  const owner = await matchOwner(id);
  if (!owner) throw new ApiError(404, "not_found", "We couldn't find that match.");
  if (owner !== user.id) throw new ApiError(403, "forbidden", "That match belongs to someone else.");
  const { status } = z.object({ status: z.enum(["seen", "dismissed"]) }).parse(await jsonBody(req));
  await setMatchStatus(id, status);
  return ok({ ok: true });
});

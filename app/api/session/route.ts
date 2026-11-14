import { ok, route, jsonBody, ApiError } from "@/lib/api";
import { SessionBody } from "@/lib/validation";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { getUser, upsertUserByEmail } from "@/lib/db/queries";
import { isDemoMode } from "@/lib/env";

export const POST = route(async (req) => {
  const body = SessionBody.parse(await jsonBody(req));
  if ("userId" in body) {
    if (!isDemoMode()) throw new ApiError(403, "forbidden", "Switching people is only available in demo mode.");
    const u = getUser(body.userId);
    if (!u) throw new ApiError(404, "not_found", "We couldn't find that person.");
    await setSessionCookie(u.id);
    return ok({ user: u });
  }
  const u = upsertUserByEmail(body.name, body.email);
  await setSessionCookie(u.id);
  return ok({ user: u });
});

export const DELETE = route(async () => {
  await clearSessionCookie();
  return ok({ ok: true });
});

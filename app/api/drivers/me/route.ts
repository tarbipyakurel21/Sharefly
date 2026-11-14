import { ok, route, requireUser, jsonBody } from "@/lib/api";
import { DriverBody } from "@/lib/validation";
import { getDriver, upsertDriver } from "@/lib/db/queries";

export const GET = route(async () => ok({ driver: getDriver((await requireUser()).id) }));
export const PUT = route(async (req) => {
  const user = await requireUser();
  return ok({ driver: upsertDriver(user.id, DriverBody.parse(await jsonBody(req))) });
});

import { ok, route, requireUser } from "@/lib/api";
import { matchesForUser } from "@/lib/db/queries";

export const GET = route(async () => ok({ matches: await matchesForUser((await requireUser()).id) }));

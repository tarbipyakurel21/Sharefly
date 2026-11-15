import { ok, route, requireUser } from "@/lib/api";
import { getReferenceSpaceProvider } from "@/lib/reference-spaces/provider";
import { SearchFiltersSchema } from "@/lib/reference-spaces/types";
import { estimateRoom, planSqft } from "@/lib/reference-spaces/estimate";

export const dynamic = "force-dynamic";

/** Search real apartment floor plans (CoStar). Returns `available: false` when the data is not installed. */
export const GET = route(async (req) => {
  await requireUser();
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const filters = SearchFiltersSchema.parse(sp);
  const provider = getReferenceSpaceProvider();
  if (!provider.isAvailable()) return ok({ available: false, spaces: [], total: 0 });
  const { spaces, total } = await provider.search(filters);
  return ok({
    available: true, total,
    spaces: spaces.map((s) => { const sq = planSqft(s); return { ...s, estimate: sq ? estimateRoom(sq, s.beds) : null }; }),
  });
});

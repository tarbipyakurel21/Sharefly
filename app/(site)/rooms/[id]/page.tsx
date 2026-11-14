import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getListing, getRoom, listPlacements } from "@/lib/db/queries";
import { SignInCard } from "@/components/layout/SignInForm";
import { RoomPlannerLoader } from "@/components/room/RoomPlannerLoader";
import type { ListingMeta } from "@/components/room/RoomPlanner";

export const metadata: Metadata = { title: "Room planner" };
export const dynamic = "force-dynamic";

export default async function RoomPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ add?: string }> }) {
  const user = await getSessionUser();
  if (!user) return <SignInCard title="Sign in to see your room" />;
  const { id } = await params;
  const { add } = await searchParams;
  const room = getRoom(id);
  if (!room || room.userId !== user.id) notFound();
  const placements = listPlacements(room.id);
  const ids = new Set(placements.map((p) => p.listingId).filter(Boolean) as string[]);
  if (add) ids.add(add);
  const listings: Record<string, ListingMeta> = {};
  for (const lid of ids) {
    const l = getListing(lid);
    if (l) listings[lid] = { title: l.title, status: l.status, category: l.category, widthM: l.widthM, depthM: l.depthM, heightM: l.heightM, hasSize: l.widthM != null };
  }
  const addable = add && listings[add] && listings[add].status === "available" ? add : null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm"><Link href="/rooms" className="text-muted underline">All rooms</Link></div>
      <RoomPlannerLoader room={room} initial={placements.map(({ roomId: _r, ...p }) => p)} listings={listings} addListingId={addable} />
    </div>
  );
}

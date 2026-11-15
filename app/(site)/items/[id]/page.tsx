import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListing, getUser, listRooms, hasInterest, hasMeasurementRequest, activePickupForListing, countOpenMeasurementRequests, markMatchesSeenForListing, firstName } from "@/lib/db/queries";
import { getDb } from "@/lib/db/client";
import { getSessionUser } from "@/lib/auth";
import { FURNITURE, CATEGORY_LABEL } from "@/lib/categories";
import { fitForRooms } from "@/lib/fit";
import { formatPrice, timeAgo } from "@/lib/format";
import { formatLength } from "@/lib/units";
import { ItemActions } from "@/components/listing/ItemActions";
import { ArViewer } from "@/components/listing/ArViewer";
import { OwnerPanel } from "@/components/listing/OwnerPanel";
import { FitBadge } from "@/components/listing/FitBadge";
import { LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const l = getListing((await params).id);
  return { title: l?.title ?? "Item" };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = getListing(id);
  if (!l) notFound();
  const user = await getSessionUser();
  const rooms = user ? listRooms(user.id) : [];
  const isOwner = user?.id === l.giverId;
  if (user && !isOwner) markMatchesSeenForListing(l.id, user.id);
  const available = l.status === "available";
  const fit = user && !isOwner ? fitForRooms(l, rooms) : null;
  const hasSize = l.widthM != null && l.depthM != null && l.heightM != null;
  const interestCount = (getDb().prepare("SELECT COUNT(*) c FROM interests WHERE listing_id=?").get(l.id) as { c: number }).c;
  const unit = (rooms[0]?.displayUnit ?? "ft") as "ft" | "m";

  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-3xl bg-sunken">
          {l.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.photoUrl} alt={l.title} className="aspect-[4/3] w-full object-cover" />
          ) : <div className="flex aspect-[4/3] items-center justify-center text-muted">No photo</div>}
        </div>
        {FURNITURE.includes(l.category) && l.status !== "removed" && (
          <ArViewer title={l.title} category={l.category} photoUrl={l.photoUrl} widthM={l.widthM} depthM={l.depthM} heightM={l.heightM} unit={unit} />
        )}
      </div>
      <div className="space-y-6">
        {!available && (
          <div role="status" className="rounded-2xl bg-sunken p-4">
            <p className="font-semibold">{l.status === "claimed" ? "This one has found a home." : "This listing was taken down."}</p>
            <p className="mt-1 text-sm text-muted">Thanks for stopping by. There's plenty more to look at.</p>
            <div className="mt-3"><LinkButton href="/browse" variant="secondary">Browse what's available</LinkButton></div>
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2"><Chip tone="accent">{CATEGORY_LABEL[l.category]}</Chip>{fit && <FitBadge status={fit} />}</div>
          <h1 className="mt-3 font-display text-3xl font-semibold">{l.title}</h1>
          <p className={`mt-1 text-xl font-semibold ${l.priceCents === 0 ? "text-good" : ""}`}>{formatPrice(l.priceCents)}</p>
          <p className="mt-2 text-sm text-muted">Shared by {firstName(l.giverName)} · {l.neighborhood ?? "Neighborhood not shared"}{l.publishedAt ? ` · ${timeAgo(l.publishedAt)}` : ""}</p>
        </div>

        <p className="whitespace-pre-line">{l.description || <span className="text-muted">No description added.</span>}</p>
        <dl className="space-y-2 text-[15px]">
          <div className="flex gap-2"><dt className="w-32 shrink-0 text-muted">Condition</dt><dd>{l.conditionNote ?? <span className="text-muted">Not provided</span>}</dd></div>
          {l.purchasedFrom && <div className="flex gap-2"><dt className="w-32 shrink-0 text-muted">Bought at</dt><dd>{l.purchasedFrom}</dd></div>}
          <div className="flex gap-2"><dt className="w-32 shrink-0 text-muted">Size</dt>
            <dd>{hasSize ? `${formatLength(l.widthM!, unit)} wide × ${formatLength(l.depthM!, unit)} deep × ${formatLength(l.heightM!, unit)} tall (from the giver)` : <span>Size not provided yet. <span className="text-muted">We can't confirm it fits until someone measures it.</span></span>}</dd></div>
        </dl>

        {available && isOwner && <OwnerPanel id={l.id} hasSize={hasSize} interestCount={interestCount} openRequests={countOpenMeasurementRequests(l.id)} status={l.status} />}
        {available && !isOwner && (
          <ItemActions listingId={l.id} hasSize={hasSize} isFurniture={FURNITURE.includes(l.category)} signedIn={!!user} interested={!!user && hasInterest(l.id, user.id)}
            requestedMeasure={!!user && hasMeasurementRequest(l.id, user.id)} activePickup={!!user && !!activePickupForListing(l.id, user.id)}
            rooms={rooms.map((r) => ({ id: r.id, name: r.name }))} defaultTo={(user && getUser(user.id)?.neighborhood) || ""} fromNeighborhood={l.neighborhood ?? "To be arranged"} />
        )}
        {!available && isOwner && <OwnerPanel id={l.id} hasSize={hasSize} interestCount={interestCount} openRequests={0} status={l.status} />}
      </div>
    </div>
  );
}

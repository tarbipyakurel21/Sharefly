"use client";
import { tourCandidates, type MatterportIdSet } from "@/lib/matterport/tour";
import { BundleRoomStage, type StageItem } from "./BundleRoomStage";
import { TourPanel } from "./TourPanel";

/** A room made from a map-picked apartment: the Matterport scan is the room. Falls back to the view-only tour without an SDK key. */
export function MatterportRoom({ matterport, title, items }: { matterport: MatterportIdSet; title: string; items: StageItem[] }) {
  const key = process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY;
  const first = tourCandidates(matterport)[0];
  if (!first) return <p data-testid="tour-none" className="rounded-xl bg-sunken p-3 text-sm text-muted">No 3D tour is available for this space.</p>;
  if (!key) {
    return (
      <div className="space-y-3">
        <p data-testid="bundle-nokey" role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">Placing furniture in the 3D tour needs NEXT_PUBLIC_MATTERPORT_SDK_KEY and the Matterport bundle (npm run matterport:bundle). Showing the view-only tour.</p>
        <TourPanel matterport={matterport} title={title} stageHref="/rooms" stageLabel="Your rooms" />
      </div>
    );
  }
  return <BundleRoomStage modelId={first.modelId} sdkKey={key} title={title} items={items} />;
}

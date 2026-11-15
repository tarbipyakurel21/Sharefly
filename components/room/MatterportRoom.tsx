"use client";
import { useEffect, useState } from "react";
import { tourCandidates, type MatterportIdSet } from "@/lib/matterport/tour";
import { BundleRoomStage, type StageItem } from "./BundleRoomStage";
import { TourPanel } from "./TourPanel";

/** A room made from a map-picked apartment: the Matterport scan is the room. Falls back to the view-only tour without an SDK key. */
export function MatterportRoom({ matterport, title, items, roomDims }: { matterport: MatterportIdSet; title: string; items: StageItem[]; roomDims?: { lengthM: number; widthM: number; heightM: number } | null }) {
  const key = process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY;
  const first = tourCandidates(matterport)[0];
  // The Matterport bundle is downloaded at build time and can be missing on a deployment. Check before showing a blank player.
  const [bundle, setBundle] = useState<"checking" | "ok" | "missing">("checking");
  useEffect(() => {
    let live = true;
    fetch("/matterport-bundle/showcase.html", { method: "HEAD" }).then((r) => live && setBundle(r.ok ? "ok" : "missing")).catch(() => live && setBundle("missing"));
    return () => { live = false; };
  }, []);
  if (!first) return <p data-testid="tour-none" className="rounded-xl bg-sunken p-3 text-sm text-muted">No 3D tour is available for this space.</p>;
  if (!key) {
    return (
      <div className="space-y-3">
        <p data-testid="bundle-nokey" role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">Placing furniture in the 3D tour needs NEXT_PUBLIC_MATTERPORT_SDK_KEY and the Matterport bundle (npm run matterport:bundle). Showing the view-only tour.</p>
        <TourPanel matterport={matterport} title={title} stageHref="/rooms" stageLabel="Your rooms" />
      </div>
    );
  }
  if (bundle === "missing") {
    return (
      <div className="space-y-3">
        <p data-testid="bundle-missing" role="status" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">Placing furniture in the 3D tour isn't available on this site right now. Showing the view-only tour.</p>
        <TourPanel matterport={matterport} title={title} stageHref="/rooms" stageLabel="Your rooms" />
      </div>
    );
  }
  if (bundle === "checking") return <div className="skeleton aspect-video rounded-xl" aria-label="Loading the 3D tour" />;
  return <BundleRoomStage modelId={first.modelId} sdkKey={key} title={title} items={items} roomDims={roomDims ?? null} />;
}

"use client";
import { RoomPlanner, type ListingMeta } from "./RoomPlanner";
import type { Room } from "@/lib/db/types";
import type { PlacedPiece } from "./types";

export function RoomPlannerLoader(props: { room: Room; initial: PlacedPiece[]; listings: Record<string, ListingMeta>; addListingId: string | null }) {
  return <RoomPlanner {...props} />;
}

import type { Placement } from "@/lib/db/types";
export type PlacedPiece = Omit<Placement, "roomId">;

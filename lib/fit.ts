import { FURNITURE } from "@/lib/categories";
import { fitStatus, type FitStatus } from "@/lib/room/geometry";
import type { Listing, Room } from "@/lib/db/types";

/** Fit across a person's rooms. Null means no badge (not furniture, or no rooms). Never "fits" for unknown sizes. */
export function fitForRooms(l: Pick<Listing, "category" | "widthM" | "depthM" | "heightM">, rooms: Room[]): FitStatus | null {
  if (!FURNITURE.includes(l.category) || rooms.length === 0) return null;
  const results = rooms.map((r) => fitStatus({ widthM: l.widthM, depthM: l.depthM, heightM: l.heightM }, r));
  if (results.includes("fits")) return "fits";
  if (results.every((r) => r === "wont_fit")) return "wont_fit";
  return "cant_confirm";
}

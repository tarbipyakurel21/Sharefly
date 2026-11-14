import type { Category } from "@/lib/categories";

export type User = { id: string; name: string; email: string; neighborhood: string | null };
export type ListingStatus = "draft" | "available" | "pending" | "claimed" | "removed";
export type Listing = {
  id: string; giverId: string; giverName: string; title: string; description: string; category: Category; status: ListingStatus;
  priceCents: number; conditionNote: string | null; purchasedFrom: string | null; neighborhood: string | null;
  lat: number | null; lng: number | null; widthM: number | null; depthM: number | null; heightM: number | null;
  dimensionsSource: "unknown" | "giver_provided"; aiGenerated: boolean; createdAt: string; publishedAt: string | null;
  photoUrl: string | null;
};
export type Wishlist = {
  id: string; userId: string; rawText: string; categories: Category[]; keywords: string[]; maxPriceCents: number | null;
  maxDistanceKm: number | null; neighborhood: string | null; lat: number | null; lng: number | null; active: boolean; createdAt: string;
};
export type MatchRow = {
  id: string; listingId: string; wishlistId: string; score: number; reasons: string[]; status: "new" | "seen" | "dismissed"; createdAt: string;
  listing: Listing; wishlistText: string;
};
export type Room = { id: string; userId: string; name: string; lengthM: number; widthM: number; heightM: number; displayUnit: "ft" | "m"; createdAt: string; updatedAt: string };
export type Placement = {
  id: string; roomId: string; listingId: string | null; label: string; category: Category; x: number; z: number; rotationY: number;
  widthM: number; depthM: number; heightM: number; dimensionsConfirmed: boolean;
};
export type PickupStatusT = "open" | "offered" | "accepted" | "completed" | "cancelled";
export type Pickup = {
  id: string; listingId: string; listingTitle: string; listingPhotoUrl: string | null; listingStatus: ListingStatus;
  requesterId: string; requesterName: string; driverId: string | null; driverName: string | null; status: PickupStatusT;
  fromNeighborhood: string; toNeighborhood: string; preferredWindow: string | null; note: string | null; driverNote: string | null; createdAt: string; giverId: string;
};
export type Notification = { id: string; userId: string; type: string; title: string; body: string; href: string; readAt: string | null; createdAt: string };
export type Driver = { id: string; userId: string; neighborhood: string; days: string[]; vehicleNote: string | null; active: boolean };

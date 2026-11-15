import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { ROOM_LIMITS } from "@/lib/room/defaults";

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => text(max).optional().nullable().transform((v) => (v ? v : null));
const dim = z.number().positive().max(10).nullable().optional();

export const SessionBody = z.union([
  z.object({ name: text(60).min(1, "Please tell us your name."), email: z.string().trim().email("That email doesn't look right.").max(120) }),
  z.object({ userId: z.string().min(1) }),
]);

export const ListingBody = z.object({
  title: text(80).min(3, "Please add a short title."),
  description: text(600).optional().default(""),
  category: z.enum(CATEGORIES).default("other"),
  priceCents: z.number().int().min(0).max(100000).default(0),
  conditionNote: optText(400),
  purchasedFrom: optText(60),
  neighborhood: optText(80),
  widthM: dim, depthM: dim, heightM: dim,
  aiGenerated: z.boolean().default(false),
  photoUrl: z.string().regex(/^(\/api\/uploads\/[a-f0-9-]+\.(jpg|png|webp)|\/seed\/[\w.-]+)$/, "That photo couldn't be used.").nullable().optional(),
  photoWidth: z.number().int().positive().max(10000).nullable().optional(),
  photoHeight: z.number().int().positive().max(10000).nullable().optional(),
  clientKey: z.string().min(8).max(80).optional(),
});

export const ListingPatch = z.object({
  title: text(80).min(3).optional(),
  description: text(600).optional(),
  category: z.enum(CATEGORIES).optional(),
  priceCents: z.number().int().min(0).max(100000).optional(),
  conditionNote: optText(400),
  neighborhood: optText(80),
  widthM: dim, depthM: dim, heightM: dim,
  status: z.enum(["available", "claimed", "removed"]).optional(),
});

export const WishlistBody = z.object({
  rawText: text(400).min(2, "Tell us a little about what you're looking for."),
  maxPriceDollars: z.number().min(0).max(5000).nullable().optional(),
  maxDistanceMiles: z.number().min(0.5).max(100).nullable().optional(),
  neighborhood: optText(80),
  active: z.boolean().optional(),
});

export const RoomBody = z.object({
  name: text(40).min(1).default("My room"),
  lengthM: z.number().min(ROOM_LIMITS.minLW, "Length should be between 1 m (3.3 ft) and 30 m (98 ft).").max(ROOM_LIMITS.maxLW, "Length should be between 1 m (3.3 ft) and 30 m (98 ft)."),
  widthM: z.number().min(ROOM_LIMITS.minLW, "Width should be between 1 m (3.3 ft) and 30 m (98 ft).").max(ROOM_LIMITS.maxLW, "Width should be between 1 m (3.3 ft) and 30 m (98 ft)."),
  heightM: z.number().min(ROOM_LIMITS.minH, "Ceiling height should be between 1.8 m (6 ft) and 6 m (19.7 ft).").max(ROOM_LIMITS.maxH, "Ceiling height should be between 1.8 m (6 ft) and 6 m (19.7 ft)."),
  displayUnit: z.enum(["ft", "m"]).default("ft"),
  /** Optional: id of a reference space. The server looks it up; the client never supplies source details. */
  referenceSpaceId: z.string().min(1).max(60).optional(),
});

export const PlacementsBody = z.object({
  placements: z.array(z.object({
    id: z.string().min(1).max(60), listingId: z.string().nullable(), label: text(80), category: z.enum(CATEGORIES),
    x: z.number().finite(), z: z.number().finite(), rotationY: z.number().finite(),
    widthM: z.number().positive().max(30), depthM: z.number().positive().max(30), heightM: z.number().positive().max(10),
    dimensionsConfirmed: z.boolean(),
  })).max(60),
});

export const PickupBody = z.object({
  listingId: z.string().min(1),
  fromNeighborhood: text(80).optional(),
  toNeighborhood: text(80).min(2, "Where should the item be dropped off?"),
  preferredWindow: optText(80),
  note: optText(300),
});
export const PickupActionBody = z.object({ action: z.enum(["offer", "accept", "decline", "withdraw", "complete", "cancel"]), contactNote: optText(200) });

export const DriverBody = z.object({
  neighborhood: text(80).min(2, "Where do you usually drive?"),
  days: z.array(z.string().max(12)).max(7).default([]),
  vehicleNote: optText(80),
  active: z.boolean().default(true),
});

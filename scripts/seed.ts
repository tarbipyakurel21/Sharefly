/* Deterministic demo seed. `npm run db:seed` upserts fixed ids; `--reset` wipes everything first.
   Not seeded on purpose: the demo desk listing and Maya's desk wishlist/room (the demo creates them live). */
import fs from "node:fs";
for (const f of [".env.local", ".env"]) { try { if (fs.existsSync(f)) process.loadEnvFile(f); } catch { /* optional */ } }
import { getDb } from "../lib/db/client";
import { createListing, createPickup, createRoom, createWishlist, replacePlacements, upsertDriver, upsertUserByEmail } from "../lib/db/queries";
import { runMatchingForListing, runMatchingForWishlist } from "../lib/matching/run";
import { parseWishlistText } from "../lib/matching/parse";
import { ftToM } from "../lib/units";
import type { Category } from "../lib/categories";

const reset = process.argv.includes("--reset");
const db = getDb();

const USERS = [
  { id: "u-maya", name: "Maya Chen (Receiver)", email: "maya@example.com", nb: "Princeton University Campus" },
  { id: "u-jordan", name: "Jordan Rivera (Giver)", email: "jordan@example.com", nb: "Downtown Princeton" },
  { id: "u-sam", name: "Sam Okafor (Ride Sharer)", email: "sam@example.com", nb: "Downtown Princeton" },
];

type L = { id: string; giver: string; title: string; desc: string; cat: Category; img: string; nb: string; dims?: [number, number, number]; price?: number; status?: string; note?: string; from?: string };
const LISTINGS: L[] = [
  { id: "l-sofa", giver: "u-jordan", title: "Grey three-seat sofa", desc: "A grey fabric sofa with removable back cushions.", cat: "sofa", img: "sofa", nb: "Downtown Princeton", dims: [1.9, 0.9, 0.85], note: "A few small stains on one cushion.", from: "IKEA" },
  { id: "l-shelf", giver: "u-jordan", title: "Tall wooden bookshelf", desc: "A wooden bookshelf with four open shelves.", cat: "bookshelf", img: "bookshelf", nb: "Downtown Princeton" },
  { id: "l-table", giver: "u-jordan", title: "Round wooden side table", desc: "A round side table with a single center leg.", cat: "table", img: "table", nb: "Downtown Princeton", dims: [0.7, 0.7, 0.55] },
  { id: "l-lamp", giver: "u-jordan", title: "Floor lamp with yellow shade", desc: "A floor lamp with a thin dark stand and a yellow shade.", cat: "lamp", img: "lamp", nb: "Downtown Princeton" },
  { id: "l-dresser", giver: "u-jordan", title: "Wooden chest of drawers", desc: "A wooden dresser with three wide drawers.", cat: "dresser", img: "dresser", nb: "Downtown Princeton", dims: [1.0, 0.5, 0.8] },
  { id: "l-chair", giver: "u-jordan", title: "Teal desk chair", desc: "A teal chair with a curved back.", cat: "chair", img: "chair", nb: "Downtown Princeton" },
  { id: "l-bed", giver: "u-jordan", title: "Bed frame with wooden headboard", desc: "A bed frame with a low wooden headboard.", cat: "bed", img: "bed", nb: "Princeton Junction", from: "Amazon" },
  { id: "l-rug", giver: "u-jordan", title: "Red patterned rug", desc: "A red rug with a yellow border.", cat: "rug", img: "rug", nb: "Downtown Princeton", dims: [1.6, 2.3, 0.02] },
  { id: "l-pots", giver: "u-jordan", title: "Pots and pans", desc: "A stack of metal pots and pans with black handles.", cat: "kitchenware", img: "kitchenware", nb: "Downtown Princeton", price: 500 },
  { id: "l-books", giver: "u-jordan", title: "Stack of paperback books", desc: "A stack of four paperbacks in different colors.", cat: "books", img: "books", nb: "Downtown Princeton" },
  { id: "l-monitor", giver: "u-jordan", title: "Computer monitor", desc: "A flat screen monitor on a small stand.", cat: "electronics", img: "electronics", nb: "Downtown Princeton" },
  { id: "l-cabinet", giver: "u-jordan", title: "Storage cabinet", desc: "A cream-colored cabinet with a top lid.", cat: "storage", img: "storage", nb: "Downtown Princeton", from: "Walmart" },
  { id: "l-dchair", giver: "u-jordan", title: "Wooden dining chair", desc: "A plain wooden chair with a straight back.", cat: "chair", img: "chair", nb: "Downtown Princeton" },
  { id: "l-armchair", giver: "u-jordan", title: "Blue armchair", desc: "A blue armchair with wide arms.", cat: "sofa", img: "sofa", nb: "Downtown Princeton", status: "claimed" },
];

const tables = ["notifications", "matches", "pickup_requests", "driver_availability", "measurement_requests", "interests", "room_placements", "rooms", "wishlists", "listing_photos", "listings", "users"];
db.transaction(() => {
  if (reset) for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
  else {
    // upsert semantics: remove only the rows this seed owns, then re-insert
    for (const l of LISTINGS) db.prepare("DELETE FROM listings WHERE id=?").run(l.id);
    for (const id of ["w-receiver", "w-maya", "w-jordan"]) db.prepare("DELETE FROM wishlists WHERE id=?").run(id);
    db.prepare("DELETE FROM rooms WHERE id='r-maya'").run();
    db.prepare("DELETE FROM pickup_requests WHERE id LIKE 'pk-%'").run();
  }
})();

for (const u of USERS) upsertUserByEmail(u.name, u.email, u.nb, u.id);

const base = Date.now();
LISTINGS.forEach((l, i) => {
  const at = new Date(base - (i + 1) * 3 * 3600_000).toISOString();
  const row = createListing({
    id: l.id, giverId: l.giver, title: l.title, description: l.desc, category: l.cat, priceCents: l.price ?? 0, conditionNote: l.note ?? null,
    purchasedFrom: l.from ?? null, neighborhood: l.nb, widthM: l.dims?.[0] ?? null, depthM: l.dims?.[1] ?? null, heightM: l.dims?.[2] ?? null,
    photo: { url: `/seed/${l.img}.jpg`, width: 800, height: 600 }, publishedAt: at,
  });
  if (l.status) db.prepare("UPDATE listings SET status=? WHERE id=?").run(l.status, row.id);
});

for (const [id, user, text, nb] of [
  ["w-receiver", "u-maya", "a bookshelf under $20 within 5 miles", "Princeton University Campus"],
] as const) {
  const p = parseWishlistText(text);
  createWishlist(user, { rawText: text, ...p, neighborhood: nb }, id);
}

createRoom("u-maya", { name: "Receiver room", lengthM: ftToM(12), widthM: ftToM(10), heightM: ftToM(8), displayUnit: "ft" }, "r-maya");
replacePlacements("r-maya", [
  { id: "pl-bed", listingId: null, label: "My bed", category: "bed", x: -1.0, z: -0.9, rotationY: 0, widthM: 1.0, depthM: 2.0, heightM: 0.5, dimensionsConfirmed: true },
]);

upsertDriver("u-sam", { neighborhood: "Downtown Princeton", days: ["Mon", "Wed", "Sat"], vehicleNote: "Hatchback" });
createPickup({ id: "pk-open", listingId: "l-shelf", requesterId: "u-maya", fromNeighborhood: "Downtown Princeton", toNeighborhood: "Princeton University Campus", preferredWindow: "Weekday evening" });
createPickup({ id: "pk-offered", listingId: "l-table", requesterId: "u-maya", fromNeighborhood: "Downtown Princeton", toNeighborhood: "Princeton University Campus", preferredWindow: "Saturday morning", status: "offered", driverId: "u-sam" });
createPickup({ id: "pk-accepted", listingId: "l-lamp", requesterId: "u-maya", fromNeighborhood: "Downtown Princeton", toNeighborhood: "Princeton University Campus", status: "accepted", driverId: "u-sam" });
createPickup({ id: "pk-completed", listingId: "l-armchair", requesterId: "u-maya", fromNeighborhood: "Downtown Princeton", toNeighborhood: "Princeton University Campus", status: "completed", driverId: "u-sam" });

for (const l of LISTINGS) runMatchingForListing(l.id);
runMatchingForWishlist("w-receiver");

const count = (t: string) => (db.prepare(`SELECT COUNT(*) c FROM ${t}`).get() as { c: number }).c;
console.log(`Seeded${reset ? " (reset)" : ""}: ${count("users")} people, ${count("listings")} listings, ${count("wishlists")} wishlists, ${count("matches")} matches, ${count("pickup_requests")} pickups.`);

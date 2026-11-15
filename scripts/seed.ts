/* Deterministic demo seed. `npm run db:seed` upserts fixed ids; `--reset` wipes everything first.
   Not seeded on purpose: the demo desk listing and Priya's desk wishlist/room (the demo creates them live). */
import fs from "node:fs";
for (const f of [".env.local", ".env"]) { try { if (fs.existsSync(f)) process.loadEnvFile(f); } catch { /* optional */ } }
import { getDb, getMongoClient } from "../lib/db/client";
import { createListing, createRoom, createWishlist, replacePlacements, upsertUserByEmail } from "../lib/db/queries";
import { runMatchingForListing, runMatchingForWishlist } from "../lib/matching/run";
import { parseWishlistText } from "../lib/matching/parse";
import { ftToM } from "../lib/units";
import type { Category } from "../lib/categories";

const reset = process.argv.includes("--reset");

const USERS = [
  { id: "u-priya", name: "Priya (Receiver)", email: "priya@example.com", nb: "USC / Exposition Park" },
  { id: "u-hardika", name: "Hardika (Giver)", email: "hardika@example.com", nb: "Downtown Los Angeles" },
  { id: "u-tarbi", name: "Tarbi (Helper)", email: "tarbi@example.com", nb: "Downtown Los Angeles" },
];

type L = { id: string; giver: string; title: string; desc: string; cat: Category; img: string; nb: string; dims?: [number, number, number]; price?: number; status?: string; note?: string; from?: string };
const LISTINGS: L[] = [
  { id: "l-sofa", giver: "u-hardika", title: "Green three-seat sofa", desc: "A green fabric sofa with removable back cushions.", cat: "sofa", img: "sofa", nb: "Downtown Los Angeles", dims: [1.9, 0.9, 0.85], note: "A few small stains on one cushion.", from: "IKEA" },
  { id: "l-shelf", giver: "u-hardika", title: "Tall wooden bookshelf", desc: "A wooden bookshelf with four open shelves.", cat: "bookshelf", img: "bookshelf", nb: "Downtown Los Angeles" },
  { id: "l-table", giver: "u-hardika", title: "Round wooden side table", desc: "A round side table with a single center leg.", cat: "table", img: "table", nb: "Downtown Los Angeles", dims: [0.7, 0.7, 0.55] },
  { id: "l-lamp", giver: "u-hardika", title: "Floor lamp with yellow shade", desc: "A floor lamp with a thin dark stand and a yellow shade.", cat: "lamp", img: "lamp", nb: "Downtown Los Angeles" },
  { id: "l-dresser", giver: "u-hardika", title: "Wooden chest of drawers", desc: "A wooden dresser with three wide drawers.", cat: "dresser", img: "dresser", nb: "Downtown Los Angeles", dims: [1.0, 0.5, 0.8] },
  { id: "l-chair", giver: "u-hardika", title: "Teal desk chair", desc: "A teal chair with a curved back.", cat: "chair", img: "chair", nb: "Downtown Los Angeles" },
  { id: "l-bed", giver: "u-hardika", title: "Bed frame with wooden headboard", desc: "A bed frame with a low wooden headboard.", cat: "bed", img: "bed", nb: "Koreatown", from: "Amazon" },
  { id: "l-rug", giver: "u-hardika", title: "Red patterned rug", desc: "A red rug with a yellow border.", cat: "rug", img: "rug", nb: "Downtown Los Angeles", dims: [1.6, 2.3, 0.02] },
  { id: "l-pots", giver: "u-hardika", title: "Pots and pans", desc: "A stack of metal pots and pans with black handles.", cat: "kitchenware", img: "kitchenware", nb: "Downtown Los Angeles" },
  { id: "l-books", giver: "u-hardika", title: "Stack of paperback books", desc: "A stack of four paperbacks in different colors.", cat: "books", img: "books", nb: "Downtown Los Angeles" },
  { id: "l-monitor", giver: "u-hardika", title: "Computer monitor", desc: "A flat screen monitor on a small stand.", cat: "electronics", img: "electronics", nb: "Downtown Los Angeles" },
  { id: "l-cabinet", giver: "u-hardika", title: "Storage cabinet", desc: "A cream-colored cabinet with a top lid.", cat: "storage", img: "storage", nb: "Downtown Los Angeles", from: "Walmart" },
  { id: "l-dchair", giver: "u-hardika", title: "Wooden dining chair", desc: "A plain wooden chair with a straight back.", cat: "chair", img: "chair", nb: "Downtown Los Angeles" },
  { id: "l-armchair", giver: "u-hardika", title: "Blue armchair", desc: "A blue armchair with wide arms.", cat: "sofa", img: "sofa", nb: "Downtown Los Angeles", status: "claimed" },
];

const tables = ["notifications", "matches", "pickups", "drivers", "measurementRequests", "interests", "rooms", "wishlists", "listings", "users"];

async function main() {
const db = await getDb();
console.log(`Seeding MongoDB database "${db.databaseName}"${reset ? " (RESET: wiping app collections)" : ""}.`);
if (reset) for (const t of tables) await db.collection(t).deleteMany({});
else {
  // upsert semantics: remove only the rows this seed owns, then re-insert
  const lids = LISTINGS.map((l) => l.id);
  await db.collection("matches").deleteMany({ listingId: { $in: lids } });
  for (const t of ["interests", "measurementRequests"]) await db.collection(t).deleteMany({ listingId: { $in: lids } });
  await db.collection("listings").deleteMany({ _id: { $in: lids as never[] } });
  const wids = ["w-receiver", "w-priya", "w-hardika"];
  await db.collection("matches").deleteMany({ wishlistId: { $in: wids } });
  await db.collection("wishlists").deleteMany({ _id: { $in: wids as never[] } });
  await db.collection("rooms").deleteOne({ _id: "r-priya" as never });
}

for (const u of USERS) await upsertUserByEmail(u.name, u.email, u.nb, u.id);

const base = Date.now();
for (const [i, l] of LISTINGS.entries()) {
  const at = new Date(base - (i + 1) * 3 * 3600_000).toISOString();
  const row = await createListing({
    id: l.id, giverId: l.giver, title: l.title, description: l.desc, category: l.cat, priceCents: l.price ?? 0, conditionNote: l.note ?? null,
    purchasedFrom: l.from ?? null, neighborhood: l.nb, widthM: l.dims?.[0] ?? null, depthM: l.dims?.[1] ?? null, heightM: l.dims?.[2] ?? null,
    photo: { url: `/seed/${l.img}.jpg`, width: 800, height: 600 }, publishedAt: at,
  });
  if (l.status) await db.collection("listings").updateOne({ _id: row.id as never }, { $set: { status: l.status } });
}

for (const [id, user, text, nb] of [
  ["w-receiver", "u-priya", "a bookshelf under $20 within 5 miles", "USC / Exposition Park"],
] as const) {
  const p = parseWishlistText(text);
  await createWishlist(user, { rawText: text, ...p, neighborhood: nb }, id);
}

await createRoom("u-priya", { name: "Receiver room", lengthM: ftToM(12), widthM: ftToM(10), heightM: ftToM(8), displayUnit: "ft" }, "r-priya");
await replacePlacements("r-priya", [
  { id: "pl-bed", listingId: null, label: "My bed", category: "bed", x: -1.0, z: -0.9, rotationY: 0, widthM: 1.0, depthM: 2.0, heightM: 0.5, dimensionsConfirmed: true },
]);


for (const l of LISTINGS) await runMatchingForListing(l.id);
await runMatchingForWishlist("w-receiver");

const count = (t: string) => db.collection(t).countDocuments();
console.log(`Seeded${reset ? " (reset)" : ""}: ${await count("users")} people, ${await count("listings")} listings, ${await count("wishlists")} wishlists, ${await count("matches")} matches.`);
}

main().then(() => getMongoClient().close()).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });

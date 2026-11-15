import { MongoClient, type Db, type Document, type Collection } from "mongodb";
import { getEnv } from "@/lib/env";

/** MongoDB is the primary store. The connection is cached on globalThis so dev reloads and serverless warm starts reuse it. */
const g = globalThis as unknown as { __sfMongo?: MongoClient; __sfMongoUri?: string; __sfIndexes?: Promise<void>; __sfSeq?: number };

export function mongoUri(): string {
  const env = getEnv();
  const uri = env.MONGO_URI ?? env.ATLAS_URI;
  if (!uri) throw new Error("MONGO_URI is not set. Add your MongoDB connection string to .env.local (and to your hosting environment variables).");
  return uri;
}

export function getMongoClient(): MongoClient {
  const uri = mongoUri();
  if (!g.__sfMongo || g.__sfMongoUri !== uri) {
    g.__sfMongo = new MongoClient(uri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, maxPoolSize: 10, appName: "sharefly" });
    g.__sfMongoUri = uri;
    g.__sfIndexes = undefined;
  }
  return g.__sfMongo;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("listings").createIndex({ status: 1, publishedAt: -1 }),
    db.collection("listings").createIndex({ clientKey: 1 }, { unique: true, partialFilterExpression: { clientKey: { $type: "string" } } }),
    db.collection("wishlists").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("matches").createIndex({ listingId: 1, wishlistId: 1 }, { unique: true }),
    db.collection("matches").createIndex({ wishlistId: 1 }),
    db.collection("rooms").createIndex({ userId: 1, createdAt: 1 }),
    db.collection("interests").createIndex({ listingId: 1, userId: 1 }, { unique: true }),
    db.collection("measurementRequests").createIndex({ listingId: 1, requesterId: 1 }, { unique: true }),
    db.collection("pickups").createIndex({ status: 1, createdAt: -1 }),
    db.collection("pickups").createIndex({ listingId: 1, requesterId: 1 }),
    db.collection("drivers").createIndex({ userId: 1 }, { unique: true }),
    db.collection("notifications").createIndex({ userId: 1, readAt: 1 }),
  ]);
}

export async function getDb(): Promise<Db> {
  const db = getMongoClient().db(getEnv().ATLAS_DB);
  g.__sfIndexes ??= ensureIndexes(db).catch((e) => { g.__sfIndexes = undefined; throw e; });
  await g.__sfIndexes;
  return db;
}

/** Documents use the string id as `_id`. */
export async function col(name: string): Promise<Collection<Document>> {
  return (await getDb()).collection(name);
}

export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();
/** Monotonic-ish sequence used to keep insertion order stable for rows created in the same millisecond. */
export const nextSeq = () => { g.__sfSeq = ((g.__sfSeq ?? 0) + 1) % 1000; return Date.now() * 1000 + g.__sfSeq; };

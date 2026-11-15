import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "@/lib/env";
import { SCHEMA } from "./schema";

const g = globalThis as unknown as { __sfDb?: Database.Database; __sfDbPath?: string };

export function getDb(): Database.Database {
  const file = path.resolve(process.cwd(), getEnv().DATABASE_PATH);
  if (g.__sfDb && g.__sfDbPath === file) return g.__sfDb;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  // Additive migration for databases created before driver_note existed.
  const cols = db.prepare("PRAGMA table_info(pickup_requests)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "driver_note")) db.exec("ALTER TABLE pickup_requests ADD COLUMN driver_note TEXT");
  // Additive migration: rooms created from a reference space keep a JSON snapshot of their source.
  const roomCols = db.prepare("PRAGMA table_info(rooms)").all() as { name: string }[];
  if (!roomCols.some((c) => c.name === "source")) db.exec("ALTER TABLE rooms ADD COLUMN source TEXT");
  g.__sfDb = db;
  g.__sfDbPath = file;
  return db;
}

export const newId = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

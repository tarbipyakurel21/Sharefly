// Server only: imports secrets. Never import this from a "use client" file.
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { ApiRoomSchema, usableRooms, type MeasuredRoom } from "./dimensions";
import { isModelId } from "./tour";

/** Server-side Matterport Model API client. Credentials never leave the server. */
export type RoomsResult =
  | { ok: true; rooms: MeasuredRoom[]; unusable: number }
  | { ok: false; reason: "not_configured" | "not_found" | "no_usable_rooms" | "unavailable" };

const QUERY = `query getRooms($id: ID!) { model(id: $id) { rooms { id label dimensionEstimates { area width depth height units } } } }`;
const ResponseSchema = z.object({
  data: z.object({ model: z.object({ rooms: z.array(z.unknown()).nullable() }).nullable().optional() }).nullable().optional(),
  errors: z.array(z.object({ message: z.string().optional(), extensions: z.object({ code: z.string().optional() }).passthrough().optional() }).passthrough()).optional(),
});

const TIMEOUT_MS = 8000;
const TTL_OK = 10 * 60_000;
const TTL_FAIL = 60_000;
const g = globalThis as unknown as { __sfMp?: Map<string, { at: number; ttl: number; v: RoomsResult }> };
const cache = () => (g.__sfMp ??= new Map());

export const isModelApiConfigured = () => { const e = getEnv(); return !!(e.MATTERPORT_API_KEY && e.MATTERPORT_API_SECRET); };

/** Parses a Model API response body into a result. Pure, so it is unit tested without network. */
export function parseRoomsResponse(body: unknown): RoomsResult {
  const p = ResponseSchema.safeParse(body);
  if (!p.success) return { ok: false, reason: "unavailable" };
  if (p.data.errors?.length) {
    return { ok: false, reason: p.data.errors.some((e) => e.extensions?.code === "not.found") ? "not_found" : "unavailable" };
  }
  const raw = p.data.data?.model?.rooms;
  if (!raw) return { ok: false, reason: "not_found" };
  const rooms = raw.flatMap((r) => { const x = ApiRoomSchema.safeParse(r); return x.success ? [x.data] : []; });
  const { rooms: usable, unusable } = usableRooms(rooms);
  return usable.length ? { ok: true, rooms: usable, unusable } : { ok: false, reason: "no_usable_rooms" };
}

export async function fetchMeasuredRooms(modelId: string): Promise<RoomsResult> {
  const env = getEnv();
  if (!env.MATTERPORT_API_KEY || !env.MATTERPORT_API_SECRET) return { ok: false, reason: "not_configured" };
  if (!isModelId(modelId)) return { ok: false, reason: "not_found" };
  const hit = cache().get(modelId);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.v;
  let v: RoomsResult;
  try {
    const res = await fetch(env.MATTERPORT_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${env.MATTERPORT_API_KEY}:${env.MATTERPORT_API_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({ query: QUERY, variables: { id: modelId } }),
    });
    v = res.ok ? parseRoomsResponse(await res.json()) : { ok: false, reason: "unavailable" };
  } catch {
    v = { ok: false, reason: "unavailable" }; // timeout, network, bad JSON: fall back to the estimate
  }
  cache().set(modelId, { at: Date.now(), ttl: v.ok ? TTL_OK : TTL_FAIL, v });
  return v;
}

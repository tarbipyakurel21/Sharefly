import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { embedUrl, isModelId, tourCandidates } from "@/lib/matterport/tour";
import { toMeasuredRoom, usableRooms } from "@/lib/matterport/dimensions";
import { fetchMeasuredRooms, parseRoomsResponse } from "@/lib/matterport/model-api";
import { measuredRoomsForSpace } from "@/lib/matterport/resolve";
import { toRoomSource, sameSize } from "@/lib/reference-spaces/source";
import { CURATED_SPACES } from "@/lib/reference-spaces/curated";
import { ReferenceSpaceSchema, RoomSourceSchema } from "@/lib/reference-spaces/types";
import { searchSpaces } from "@/lib/reference-spaces/filter";

const room = (over: object = {}, units = "imperial") => ({ id: "r1", label: "Living room", dimensionEstimates: { area: 120, width: 10, depth: 12, height: 9, units, ...over } });

describe("tour candidates", () => {
  it("orders unit, then floor plan, then community, and drops repeats and bad ids", () => {
    const c = tourCandidates({ community: ["COMM0001", "UNIT0001"], floorPlan: ["FPLAN001", "bad id!"], unit: ["UNIT0001"] });
    expect(c.map((x) => `${x.level}:${x.modelId}`)).toEqual(["unit:UNIT0001", "floorPlan:FPLAN001", "community:COMM0001"]);
  });
  it("builds the confirmed embed URL and rejects unsafe ids", () => {
    expect(embedUrl("ABC12345")).toBe("https://my.matterport.com/show/?m=ABC12345");
    expect(isModelId("a/../b")).toBe(false);
    expect(isModelId("")).toBe(false);
  });
  it("returns nothing when there are no ids", () => { expect(tourCandidates({ community: [], floorPlan: [], unit: [] })).toEqual([]); });
});

describe("dimension normalisation", () => {
  it("reads units: imperial feet become meters", () => {
    expect(toMeasuredRoom(room())).toMatchObject({ widthM: 3.05, depthM: 3.66, heightM: 2.74, areaM2: 11.15 });
  });
  it("reads units: metric as is", () => { expect(toMeasuredRoom(room({ width: 3, depth: 4, height: 2.5, area: 12 }, "metric"))).toMatchObject({ widthM: 3, depthM: 4, heightM: 2.5, areaM2: 12 }); });
  it("rejects unknown units rather than guessing", () => { expect(toMeasuredRoom(room({}, "furlongs"))).toBeNull(); expect(toMeasuredRoom(room({ units: null }))).toBeNull(); });
  it("rejects null, zero and negative dimensions", () => {
    for (const bad of [{ width: null }, { depth: 0 }, { height: null }, { width: -3 }, { height: undefined }]) expect(toMeasuredRoom(room(bad))).toBeNull();
    expect(toMeasuredRoom({ id: "x", dimensionEstimates: null })).toBeNull();
  });
  it("rejects rooms outside the planner limits (closets, halls)", () => {
    expect(toMeasuredRoom(room({ width: 2, depth: 12 }))).toBeNull(); // 0.61 m wide
    expect(toMeasuredRoom(room({ height: 3 }))).toBeNull(); // 0.9 m ceiling
  });
  it("counts what it dropped", () => { expect(usableRooms([room(), room({ width: null })] as never)).toMatchObject({ unusable: 1, rooms: [{ id: "r1" }] }); });
});

describe("response parsing", () => {
  it("returns usable rooms", () => { const r = parseRoomsResponse({ data: { model: { rooms: [room(), room({ depth: 0 })] } } }); expect(r.ok && r.rooms.length).toBe(1); });
  it("maps not.found, empty and malformed bodies to fallback reasons", () => {
    expect(parseRoomsResponse({ errors: [{ message: "x", extensions: { code: "not.found" } }], data: {} })).toEqual({ ok: false, reason: "not_found" });
    expect(parseRoomsResponse({ errors: [{ message: "boom" }] })).toEqual({ ok: false, reason: "unavailable" });
    expect(parseRoomsResponse({ data: { model: { rooms: [room({ width: null })] } } })).toEqual({ ok: false, reason: "no_usable_rooms" });
    expect(parseRoomsResponse({ data: { model: null } })).toEqual({ ok: false, reason: "not_found" });
    expect(parseRoomsResponse("nope")).toEqual({ ok: false, reason: "unavailable" });
  });
  it("skips room entries that do not match the schema instead of failing", () => { const r = parseRoomsResponse({ data: { model: { rooms: [{ nope: 1 }, room()] } } }); expect(r.ok && r.rooms.length).toBe(1); });
});

describe("Model API client", () => {
  const saved = { ...process.env };
  beforeEach(() => { delete (globalThis as { __sfMp?: unknown }).__sfMp; process.env.MATTERPORT_API_KEY = "k"; process.env.MATTERPORT_API_SECRET = "s"; });
  afterEach(() => { process.env = { ...saved }; vi.unstubAllGlobals(); });

  it("does nothing without credentials", async () => {
    delete process.env.MATTERPORT_API_KEY;
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect(await fetchMeasuredRooms("MODEL001")).toEqual({ ok: false, reason: "not_configured" });
    expect(f).not.toHaveBeenCalled();
  });
  it("sends basic auth, a timeout signal and validates the body", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ data: { model: { rooms: [room()] } } })));
    vi.stubGlobal("fetch", f);
    const r = await fetchMeasuredRooms("MODEL002");
    expect(r.ok).toBe(true);
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("k:s").toString("base64")}`);
    expect(init.signal).toBeInstanceOf(AbortSignal);
    await fetchMeasuredRooms("MODEL002");
    expect(f).toHaveBeenCalledTimes(1); // cached
  });
  it("falls back on network errors, HTTP errors and timeouts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("timeout", "TimeoutError"); }));
    expect(await fetchMeasuredRooms("MODEL003")).toEqual({ ok: false, reason: "unavailable" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    expect(await fetchMeasuredRooms("MODEL004")).toEqual({ ok: false, reason: "unavailable" });
  });
  it("never puts an invalid id in a request", async () => {
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect(await fetchMeasuredRooms("x\"}) { evil")).toEqual({ ok: false, reason: "not_found" });
    expect(f).not.toHaveBeenCalled();
  });
  it("tries unit, then floor plan, then community, and stops at the first usable model", async () => {
    const seen: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => {
      const id = JSON.parse(init.body as string).variables.id; seen.push(id);
      return new Response(JSON.stringify(id === "FPLAN005" ? { data: { model: { rooms: [room()] } } } : { errors: [{ extensions: { code: "not.found" } }] }));
    }));
    const r = await measuredRoomsForSpace({ unit: ["UNIT0005"], floorPlan: ["FPLAN005"], community: ["COMM0005"] });
    expect(seen).toEqual(["UNIT0005", "FPLAN005"]);
    expect(r.ok && r.level).toBe("floorPlan");
  });
  it("reports no_model for a space without ids", async () => { expect(await measuredRoomsForSpace({ unit: [], floorPlan: [], community: [] })).toEqual({ ok: false, reason: "no_model" }); });
});

describe("room source labelling", () => {
  const space = { ...CURATED_SPACES[0], minSqft: 700 };
  it("labels estimates as estimated and measured sizes as not", () => {
    expect(toRoomSource(space)).toMatchObject({ estimated: true, dimensions: "estimate", matterportRoomLabel: null });
    expect(toRoomSource(space, { kind: "matterport", roomLabel: "Den" })).toMatchObject({ estimated: false, dimensions: "matterport", matterportRoomLabel: "Den" });
    expect(RoomSourceSchema.safeParse(toRoomSource(space, { kind: "adjusted" })).success).toBe(true);
  });
  it("still parses rooms saved before measured sizes existed", () => {
    const old = { ...toRoomSource(space), estimated: true } as Record<string, unknown>; delete old.dimensions; delete old.matterportRoomLabel;
    expect(RoomSourceSchema.safeParse(old).success).toBe(true);
  });
  it("treats sizes within 5 cm as unchanged", () => { expect(sameSize(3.05, 3.08)).toBe(true); expect(sameSize(3.05, 3.2)).toBe(false); });
});

describe("curated Princeton space", () => {
  it("is valid, has a tour id and invents nothing", () => {
    const s = CURATED_SPACES[0];
    expect(ReferenceSpaceSchema.safeParse(s).success).toBe(true);
    expect(s).toMatchObject({ city: "Princeton", beds: null, minSqft: null, lat: null });
    expect(tourCandidates(s.matterport)).toHaveLength(1);
  });
  it("is found by city and college search and excluded from distance searches", () => {
    expect(searchSpaces(CURATED_SPACES, { city: "Princeton" }).total).toBe(1);
    expect(searchSpaces(CURATED_SPACES, { q: "princeton university" }).total).toBe(1);
    expect(searchSpaces(CURATED_SPACES, { lat: 40.3, lng: -74.6, radiusKm: 50 }).total).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import { clampToRoom, overlaps, fitStatus, type Placed } from "@/lib/room/geometry";

const room = { lengthM: 4, widthM: 3, heightM: 2.5 };
const desk = (o: Partial<Placed> = {}): Placed => ({ x: 0, z: 0, rotationY: 0, widthM: 1.2, depthM: 0.6, heightM: 0.75, ...o });

describe("clampToRoom", () => {
  it("clamps at 0 degrees", () => {
    const p = clampToRoom(desk({ x: 10, z: -10 }), room);
    expect(p.x).toBeCloseTo(3 / 2 - 0.6);
    expect(p.z).toBeCloseTo(-(4 / 2 - 0.3));
  });
  it("clamps at 90 degrees using the rotated footprint", () => {
    const p = clampToRoom(desk({ x: 10, z: 10, rotationY: Math.PI / 2 }), room);
    expect(p.x).toBeCloseTo(3 / 2 - 0.3);
    expect(p.z).toBeCloseTo(4 / 2 - 0.6);
  });
  it("centres a piece larger than the room", () => {
    expect(clampToRoom(desk({ x: 1, widthM: 5 }), room).x).toBe(0);
  });
});

describe("overlaps", () => {
  it("detects overlap", () => expect(overlaps(desk(), desk({ x: 0.5 }))).toBe(true));
  it("touching is not overlap", () => expect(overlaps(desk(), desk({ x: 1.2 }))).toBe(false));
  it("separated is not overlap", () => expect(overlaps(desk(), desk({ x: 3 }))).toBe(false));
  it("handles rotation", () => {
    expect(overlaps(desk(), desk({ x: 0.9, rotationY: Math.PI / 4 }))).toBe(true);
    expect(overlaps(desk(), desk({ x: 2.2, rotationY: Math.PI / 4 }))).toBe(false);
  });
});

describe("fitStatus", () => {
  it("fits", () => expect(fitStatus({ widthM: 1.2, depthM: 0.6, heightM: 0.75 }, room)).toBe("fits"));
  it("fits when rotated", () => expect(fitStatus({ widthM: 3.5, depthM: 0.6, heightM: 0.75 }, room)).toBe("fits"));
  it("wont fit: too big", () => expect(fitStatus({ widthM: 5, depthM: 0.6, heightM: 0.75 }, room)).toBe("wont_fit"));
  it("wont fit: too tall", () => expect(fitStatus({ widthM: 1, depthM: 1, heightM: 3 }, room)).toBe("wont_fit"));
  it("unknown can never fit", () => {
    expect(fitStatus({ widthM: null, depthM: null, heightM: null }, room)).toBe("cant_confirm");
    expect(fitStatus(null, room)).toBe("cant_confirm");
    expect(fitStatus({ widthM: 1, depthM: 1, heightM: 1 }, null)).toBe("cant_confirm");
  });
});

import { findFreeSpot } from "@/lib/room/geometry";
describe("findFreeSpot", () => {
  it("avoids existing pieces", () => {
    const bed = desk({ x: 0, z: 0, widthM: 1.4, depthM: 2 });
    const spot = findFreeSpot(desk(), [bed], room);
    expect(overlaps(spot, bed)).toBe(false);
  });
  it("uses the centre when free", () => expect(findFreeSpot(desk(), [], room)).toMatchObject({ x: 0, z: 0 }));
});

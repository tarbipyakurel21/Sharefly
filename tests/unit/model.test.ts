import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { FURNITURE } from "@/lib/categories";
import { buildFurniture } from "@/lib/room/model";

const size = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());

describe("buildFurniture (shared by planner and AR)", () => {
  const [w, d, h] = [1.2, 0.6, 0.75];

  it.each(FURNITURE)("%s never exceeds the giver's measurements", (cat) => {
    const s = size(buildFurniture(cat, w, d, h));
    expect(s.x).toBeLessThanOrEqual(w + 1e-6);
    expect(s.y).toBeLessThanOrEqual(h + 1e-6);
    expect(s.z).toBeLessThanOrEqual(d + 1e-6);
  });

  it.each(FURNITURE.filter((c) => c !== "lamp"))("%s fills its measured box (so AR shows true size)", (cat) => {
    const s = size(buildFurniture(cat, w, d, h));
    expect(s.x).toBeCloseTo(w, 2);
    expect(s.y).toBeCloseTo(h, 2);
    expect(s.z).toBeCloseTo(d, 1);
  });

  it("sits on the floor, centred on its footprint", () => {
    const b = new THREE.Box3().setFromObject(buildFurniture("dresser", w, d, h));
    expect(b.min.y).toBeCloseTo(0, 6);
    expect((b.min.x + b.max.x) / 2).toBeCloseTo(0, 6);
  });

  it("ghost and tint only change materials, not size", () => {
    const a = size(buildFurniture("sofa", 2, 0.9, 0.85));
    const b = size(buildFurniture("sofa", 2, 0.9, 0.85, { ghost: true, tint: "#d4574a" }));
    expect(b.equals(a)).toBe(true);
  });

  describe("sofa", () => {
    const sizes: [string, number, number, number][] = [["three-seat", 1.9, 0.9, 0.85], ["loveseat", 1.4, 0.85, 0.8], ["armchair", 0.8, 0.8, 0.9], ["tiny", 0.5, 0.4, 0.3]];

    it.each(sizes)("%s is exactly the giver's width, height and depth", (_n, sw, sd, sh) => {
      const b = new THREE.Box3().setFromObject(buildFurniture("sofa", sw, sd, sh));
      const s = b.getSize(new THREE.Vector3());
      expect(s.x).toBeCloseTo(sw, 5);
      expect(s.y).toBeCloseTo(sh, 5);
      expect(s.z).toBeCloseTo(sd, 5);
      expect(b.min.y).toBeCloseTo(0, 6);
      expect((b.min.z + b.max.z) / 2).toBeCloseTo(0, 5);
    });

    it("has arms, cushions and four legs, with a seat cushion per seat", () => {
      const parts = (sw: number) => {
        const meshes = buildFurniture("sofa", sw, 0.9, 0.85).children as THREE.Mesh[];
        return { legs: meshes.filter((m) => m.geometry.type === "CylinderGeometry").length, upholstered: meshes.filter((m) => m.geometry.type === "RoundedBoxGeometry").length };
      };
      // 2 arms + back frame + base = 4, plus a seat and a back cushion per seat
      expect(parts(1.9)).toEqual({ legs: 4, upholstered: 4 + 3 * 2 });
      expect(parts(1.4)).toEqual({ legs: 4, upholstered: 4 + 2 * 2 });
      expect(parts(0.8)).toEqual({ legs: 4, upholstered: 4 + 1 * 2 });
    });

    it("seat height is a plausible share of the total height", () => {
      const seat = (buildFurniture("sofa", 1.9, 0.9, 0.85).children as THREE.Mesh[])
        .filter((m) => m.geometry.type === "RoundedBoxGeometry" && m.rotation.x === 0)
        .map((m) => new THREE.Box3().setFromObject(m))
        .filter((b) => b.max.z > 0.4 && b.max.x - b.min.x > 0.3 && b.max.x - b.min.x < 1)
        .map((b) => b.max.y);
      expect(seat.length).toBe(3);
      expect(seat[0]).toBeGreaterThan(0.38);
      expect(seat[0]).toBeLessThan(0.5);
    });
  });
});

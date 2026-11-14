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
});

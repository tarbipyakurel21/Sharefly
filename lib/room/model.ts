import * as THREE from "three";
import type { Category } from "@/lib/categories";

/**
 * Procedural furniture as plain three.js objects, in real meters.
 * Origin is the centre of the footprint on the floor (y = 0), front faces +z.
 * Every shape stays inside the w × h × d box it is given, so what the planner
 * and the AR viewer show is never larger than the giver's measurements.
 */

const COLORS: Partial<Record<Category, string>> = {
  desk: "#b0804f", chair: "#5b7a74", table: "#c49a6c", sofa: "#7d8aa0", bed: "#c9d2dc", mattress: "#d9dfe6", dresser: "#b8946a",
  bookshelf: "#8a6a47", storage: "#d8cdb0", lamp: "#e8c36a", rug: "#b95c50", other: "#b9b0a2",
};
const DARK = "#5f4630";

export type BuildOptions = { ghost?: boolean; tint?: string | null };
type V3 = [number, number, number];

export function buildFurniture(category: Category, w: number, d: number, h: number, opts: BuildOptions = {}): THREE.Group {
  const { ghost = false, tint = null } = opts;
  const c = COLORS[category] ?? COLORS.other!;
  const group = new THREE.Group();
  group.name = category;

  const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({
    color: tint ?? color, roughness: 0.85, transparent: ghost, opacity: ghost ? 0.55 : 1,
    emissive: new THREE.Color(tint ?? "#000000"), emissiveIntensity: tint ? 0.25 : 0, ...extra,
  });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, p: V3, shadow = true) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(...p);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    group.add(mesh);
  };
  const B = (p: V3, s: V3, col = c) => add(new THREE.BoxGeometry(...s), mat(col), p);
  const leg = 0.05, inset = 0.04;
  const legs = (top: number) => {
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B([sx * (w / 2 - inset - leg / 2), top / 2, sz * (d / 2 - inset - leg / 2)], [leg, top, leg], DARK);
  };

  switch (category) {
    case "desk":
    case "table": {
      const t = 0.04;
      B([0, h - t / 2, 0], [w, t, d]); legs(h - t);
      if (category === "desk") B([0, h * 0.62, -d / 2 + 0.06], [w - 0.12, h * 0.35, 0.02], DARK);
      break;
    }
    case "chair": {
      const t = 0.05;
      B([0, h * 0.5 - t / 2, 0], [w, t, d]); legs(h * 0.5 - t); B([0, h * 0.75, -d / 2 + 0.025], [w, h * 0.5, 0.05]);
      break;
    }
    case "sofa":
    {
      // seat and back sit between the arms so no faces overlap (avoids flicker in 3D and AR)
      const arm = w * 0.1, inner = w - arm * 2;
      B([0, h * 0.22, 0], [inner, h * 0.44, d]); B([0, h * 0.62, -d * 0.38], [inner, h * 0.76, d * 0.24]);
      B([-w / 2 + arm / 2, h * 0.3, 0], [arm, h * 0.6, d], DARK); B([w / 2 - arm / 2, h * 0.3, 0], [arm, h * 0.6, d], DARK);
      break;
    }
    case "bed":
      B([0, h * 0.2, 0.03], [w, h * 0.4, d - 0.06], DARK); B([0, h * 0.55, 0.03], [w * 0.96, h * 0.3, (d - 0.06) * 0.96], "#e9e3da");
      B([0, h * 0.75, -d * 0.3], [w * 0.6, h * 0.12, d * 0.14], "#ffffff"); B([0, h / 2, -d / 2 + 0.03], [w, h, 0.06], c);
      break;
    case "mattress":
      B([0, h / 2, 0], [w, h, d], "#e9e3da");
      break;
    case "dresser":
      B([0, h / 2, 0], [w, h, d - 0.01]);
      for (const f of [0.2, 0.5, 0.8]) B([0, h * f, d / 2 - 0.005], [w * 0.9, h * 0.26, 0.01], "#e8d9bd");
      break;
    case "bookshelf": {
      const th = 0.03;
      B([-w / 2 + th / 2, h / 2, 0], [th, h, d]); B([w / 2 - th / 2, h / 2, 0], [th, h, d]); B([0, h / 2, -d / 2 + 0.01], [w, h, 0.02], DARK);
      for (const f of [0, 0.25, 0.5, 0.75, 1]) B([0, Math.min(h - th / 2, Math.max(th / 2, h * f)), 0], [w, th, d]);
      break;
    }
    case "storage": {
      const lid = Math.min(0.03, h * 0.1);
      B([0, (h - lid) / 2, 0], [w - 0.02, h - lid, d - 0.02]); B([0, h - lid / 2, 0], [w, lid, d], DARK);
      break;
    }
    case "lamp": {
      const r = Math.min(w, d) / 2;
      add(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.04, 20), mat(DARK), [0, 0.02, 0]);
      add(new THREE.CylinderGeometry(0.012, 0.012, h * 0.8, 10), mat(DARK), [0, h * 0.4, 0], false);
      add(new THREE.CylinderGeometry(r * 0.55, r, h * 0.24, 24, 1, true), mat(c, { side: THREE.DoubleSide, emissive: new THREE.Color(tint ?? c), emissiveIntensity: 0.35 }), [0, h * 0.88, 0]);
      break;
    }
    case "rug": {
      const t = Math.max(h, 0.015);
      B([0, t / 2, 0], [w, t, d]);
      break;
    }
    default:
      B([0, h / 2, 0], [w, h, d]);
  }
  return group;
}

/** Free GPU memory for a group made by buildFurniture. */
export function disposeFurniture(group: THREE.Object3D) {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }
  });
}

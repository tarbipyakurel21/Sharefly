import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
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

const WOOD = "#4a3526";
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const shade = (hex: string, dl: number) => `#${new THREE.Color(hex).offsetHSL(0, 0, dl).getHexString()}`;

/** One weave tile covers this many meters, so the cloth grain is the same size on every cushion. */
const WEAVE_TILE_M = 0.04;
let weave: THREE.Texture | null | undefined;

/**
 * A small tiling normal map of a plain weave, drawn once in the browser. It only changes how light catches the
 * surface (no colour), and it survives the GLB export used for AR. On the server and in unit tests there is no
 * canvas, so the cloth is simply smooth.
 */
function weaveNormalMap(): THREE.Texture | null {
  if (weave !== undefined) return weave;
  if (typeof document === "undefined") return (weave = null);
  const n = 64, threads = 8;
  const height = (x: number, y: number) => {
    const u = (x / n) * threads * Math.PI * 2, v = (y / n) * threads * Math.PI * 2;
    const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return 0.5 * Math.sin(u) * Math.sin(v) + 0.25 * Math.sin(u * 0.5 + v) + 0.12 * (grain - Math.floor(grain));
  };
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return (weave = null);
  const img = ctx.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = height((x + 1) % n, y) - height((x + n - 1) % n, y), dy = height(x, (y + 1) % n) - height(x, (y + n - 1) % n);
    const v = new THREE.Vector3(-dx, -dy, 1).normalize(), i = (y * n + x) * 4;
    img.data[i] = (v.x * 0.5 + 0.5) * 255; img.data[i + 1] = (v.y * 0.5 + 0.5) * 255; img.data[i + 2] = (v.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.name = "weave";
  return (weave = tex);
}

/** Texture coordinates in real meters (projected along each face's main direction) so the weave is never stretched. */
function clothUv(geo: THREE.BufferGeometry) {
  const p = geo.attributes.position, nrm = geo.attributes.normal, uv = geo.attributes.uv, k = 1 / WEAVE_TILE_M;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    if (ax >= ay && ax >= az) uv.setXY(i, p.getZ(i) * k, p.getY(i) * k);
    else if (ay >= az) uv.setXY(i, p.getX(i) * k, p.getZ(i) * k);
    else uv.setXY(i, p.getX(i) * k, p.getY(i) * k);
  }
  uv.needsUpdate = true;
}

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
    return mesh;
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
    case "sofa": {
      // Upholstered sofa: frame, arms, seat and back cushions, short wooden legs. The arms give the full width and depth
      // and the back frame the full height, so the outer size is exactly w × h × d. Pieces touch without sharing
      // visible faces (avoids flicker in 3D and AR).
      const normalMap = weaveNormalMap();
      const cloth = (col: string) => mat(col, { roughness: 0.94, metalness: 0, ...(normalMap ? { normalMap, normalScale: new THREE.Vector2(0.45, 0.45) } : {}) });
      const R = (p: V3, s: V3, radius: number, col: string) => {
        const geo = new RoundedBoxGeometry(s[0], s[1], s[2], 4, Math.max(0.001, Math.min(radius, Math.min(...s) * 0.49)));
        clothUv(geo);
        return add(geo, cloth(col), p);
      };
      const frame = shade(c, -0.035), cushion = shade(c, 0.025);

      const legH = Math.min(0.12, h * 0.13), body = h - legH;
      const armW = Math.min(clamp(w * 0.1, 0.09, 0.2), w * 0.2), inner = w - armW * 2;
      const seatBase = legH + body * 0.24, cushH = body * 0.2, seatTop = seatBase + cushH, armTop = legH + body * 0.66;
      const backT = Math.min(clamp(d * 0.16, 0.06, 0.16), d * 0.3), backFront = -d / 2 + backT;

      for (const sx of [-1, 1]) R([sx * (w / 2 - armW / 2), (legH + armTop) / 2, 0], [armW, armTop - legH, d], Math.min(armW * 0.42, 0.07), frame);
      R([0, legH + body / 2, -d / 2 + backT / 2], [inner, body, backT], Math.min(backT * 0.4, 0.05), frame);
      const baseFront = d / 2 - 0.02;
      R([0, (legH + seatBase) / 2, (backFront + baseFront) / 2], [inner, seatBase - legH, baseFront - backFront], 0.02, frame);

      // one cushion per seat, the way sofas of this width are usually built
      const seats = inner < 0.95 ? 1 : inner < 1.45 ? 2 : 3, gap = 0.006, cw = inner / seats;
      const seatFront = d / 2 - 0.004;
      const bt = Math.min(clamp(d * 0.2, 0.08, 0.2), d * 0.35), lean = 0.14;
      const y0 = seatTop - 0.01, y1 = h - 0.012;
      const bh = (y1 - y0 - bt * Math.sin(lean)) / Math.cos(lean);
      const backHalfZ = (bt * Math.cos(lean) + bh * Math.sin(lean)) / 2;
      for (let i = 0; i < seats; i++) {
        const x = -inner / 2 + cw * (i + 0.5);
        R([x, seatBase + cushH / 2, (backFront + seatFront) / 2], [cw - gap, cushH, seatFront - backFront], Math.min(cushH * 0.45, 0.06), cushion);
        if (bh > 0.05) R([x, (y0 + y1) / 2, backFront - 0.02 + backHalfZ], [cw - gap, bh, bt], Math.min(bt * 0.45, 0.07), cushion).rotation.x = -lean;
      }

      const legR = Math.min(0.024, armW * 0.3), lx = w / 2 - Math.max(armW / 2, legR), lz = d / 2 - Math.min(0.07, d * 0.15);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        add(new THREE.CylinderGeometry(legR, legR * 0.68, legH + 0.01, 16), mat(WOOD, { roughness: 0.55 }), [sx * lx, (legH + 0.01) / 2, sz * lz]);
      }
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

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { USDLoader } from "three/examples/jsm/loaders/USDLoader.js";

export type ScanRef = { url: string; format: "glb" | "usdz" };

/** One download and parse per scan file; every placed piece gets its own clone. Browser only. */
const sources = new Map<string, Promise<THREE.Object3D>>();
export function loadScanSource(scan: ScanRef): Promise<THREE.Object3D> {
  let p = sources.get(scan.url);
  if (!p) {
    p = new Promise<THREE.Object3D>((resolve, reject) => {
      if (scan.format === "glb") new GLTFLoader().load(scan.url, (g) => resolve(g.scene), undefined, reject);
      else new USDLoader().load(scan.url, resolve, undefined, reject);
    });
    p.catch(() => sources.delete(scan.url)); // a failed load can be retried
    sources.set(scan.url, p);
  }
  return p;
}

type Opts = { ghost?: boolean; tint?: string | null };

/**
 * The owner's scan as a furniture piece: stretched to the confirmed width/depth/height (so what you see matches what the fit
 * checks use), centred on the floor like the stand-in models. Materials are cloned per piece; geometry is shared, so only
 * `disposeScanPiece` (materials) is needed.
 */
export async function buildScanPiece(scan: ScanRef, w: number, d: number, h: number, opts: Opts = {}): Promise<THREE.Group> {
  const source = await loadScanSource(scan);
  const obj = source.clone(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  if (!(size.x > 0 && size.y > 0 && size.z > 0)) throw new Error("empty scan");
  const inner = new THREE.Group();
  inner.add(obj);
  obj.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  inner.scale.set(w / size.x, h / size.y, d / size.z);
  const group = new THREE.Group();
  group.add(inner);
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = true; m.receiveShadow = true;
    const clone = (mat: THREE.Material) => {
      const c = mat.clone() as THREE.MeshStandardMaterial;
      if (opts.ghost) { c.transparent = true; c.opacity = 0.55; }
      if (opts.tint && c.emissive) { c.emissive = new THREE.Color(opts.tint); c.emissiveIntensity = 0.25; }
      return c;
    };
    m.material = Array.isArray(m.material) ? m.material.map(clone) : clone(m.material);
  });
  return group;
}

export function disposeScanPiece(group: THREE.Object3D) {
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) mat.dispose();
  });
}

/** GLB of the scan at its confirmed size, for the Matterport stage and AR. */
export async function scanToSizedGlb(scan: ScanRef, w: number, d: number, h: number): Promise<Blob> {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const piece = await buildScanPiece(scan, w, d, h);
  try {
    const scene = new THREE.Scene(); scene.add(piece);
    return new Blob([(await new GLTFExporter().parseAsync(scene, { binary: true })) as ArrayBuffer], { type: "model/gltf-binary" });
  } finally { disposeScanPiece(piece); }
}

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDLoader } from "three/examples/jsm/loaders/USDLoader.js";

/**
 * Turns the owner's own scan into a GLB blob for <model-viewer> ("View in 3D" and AR). A GLB is fetched as is;
 * a USDZ is opened with three.js and re-exported. Scale is left exactly as scanned.
 */
export async function scanToGlb(scan: { url: string; format: "glb" | "usdz" }): Promise<Blob> {
  if (scan.format === "glb") {
    const res = await fetch(scan.url);
    if (!res.ok) throw new Error("scan fetch");
    return new Blob([await res.arrayBuffer()], { type: "model/gltf-binary" });
  }
  const obj = await new Promise<THREE.Object3D>((resolve, reject) => new USDLoader().load(scan.url, resolve, undefined, reject));
  const buf = await new GLTFExporter().parseAsync(obj, { binary: true });
  return new Blob([buf as ArrayBuffer], { type: "model/gltf-binary" });
}

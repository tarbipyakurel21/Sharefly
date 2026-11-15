import * as THREE from "three";
import type { Category } from "@/lib/categories";
import { buildFurniture, disposeFurniture } from "@/lib/room/model";

/** Binary glTF of one to-scale furniture piece (real meters, origin on the floor). Browser only. */
export async function makeGlb(category: Category, w: number, d: number, h: number): Promise<Blob> {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const scene = new THREE.Scene();
  const obj = buildFurniture(category, w, d, h);
  scene.add(obj);
  try {
    const out = await new GLTFExporter().parseAsync(scene, { binary: true });
    return new Blob([out as ArrayBuffer], { type: "model/gltf-binary" });
  } finally { disposeFurniture(obj); }
}

import fs from "node:fs";
import path from "node:path";

export interface StorageProvider {
  save(bytes: Uint8Array, ext: string): Promise<{ url: string }>;
  read(name: string): Promise<{ bytes: Buffer; contentType: string } | null>;
}

const DIR = () => path.resolve(process.cwd(), "data/uploads");
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", glb: "model/gltf-binary", usdz: "model/vnd.usdz+zip" };

export class LocalStorage implements StorageProvider {
  async save(bytes: Uint8Array, ext: string) {
    fs.mkdirSync(DIR(), { recursive: true });
    const name = `${crypto.randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(DIR(), name), bytes);
    return { url: `/api/uploads/${name}` };
  }
  async read(name: string) {
    if (!/^[a-f0-9-]+\.(jpg|png|webp|glb|usdz)$/.test(name)) return null;
    const file = path.join(DIR(), name);
    if (!fs.existsSync(file)) return null;
    return { bytes: fs.readFileSync(file), contentType: TYPES[name.split(".").pop()!] };
  }
}
/** UploadThing: files live on UploadThing's CDN, so it works on read-only hosts like Vercel. Bytes are already validated by magic bytes and size before they get here. */
export class UploadThingStorage implements StorageProvider {
  async save(bytes: Uint8Array, ext: string) {
    const { UTApi, UTFile } = await import("uploadthing/server");
    const name = `${crypto.randomUUID()}.${ext}`;
    const file = new UTFile([bytes as BlobPart], name, { type: TYPES[ext] });
    const res = await new UTApi().uploadFiles(file);
    if (res.error || !res.data) throw new Error("UploadThing upload failed");
    return { url: res.data.ufsUrl };
  }
  /** Files are served straight from the UploadThing CDN, never through /api/uploads. */
  async read() { return null; }
}

export const getStorage = (): StorageProvider =>
  process.env.STORAGE_PROVIDER === "uploadthing" && process.env.UPLOADTHING_TOKEN ? new UploadThingStorage() : new LocalStorage();

/** Content-type by magic bytes, never by the client's claim. */
export function sniffImage(b: Uint8Array): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const MAX_MODEL_BYTES = 30 * 1024 * 1024;
/**
 * 3D scans by magic bytes, never by the client's claim. `.glb` starts with "glTF". `.usdz` (Reality Composer, Object Capture) is an
 * uncompressed ZIP whose first entry must be a USD file (.usdc, .usda or .usd).
 */
export function sniffModel(b: Uint8Array): { ext: "glb" | "usdz"; mime: string } | null {
  if (b.length > 12 && b[0] === 0x67 && b[1] === 0x6c && b[2] === 0x54 && b[3] === 0x46) return { ext: "glb", mime: "model/gltf-binary" };
  if (b.length > 64 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) {
    const nameLen = b[26] | (b[27] << 8);
    const name = String.fromCharCode(...b.slice(30, 30 + Math.min(nameLen, 200))).toLowerCase();
    if (/\.(usdc|usda|usd)$/.test(name)) return { ext: "usdz", mime: "model/vnd.usdz+zip" };
  }
  return null;
}

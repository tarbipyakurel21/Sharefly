import fs from "node:fs";
import path from "node:path";

export interface StorageProvider {
  save(bytes: Uint8Array, ext: string): Promise<{ url: string }>;
  read(name: string): Promise<{ bytes: Buffer; contentType: string } | null>;
}

const DIR = () => path.resolve(process.cwd(), "data/uploads");
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export class LocalStorage implements StorageProvider {
  async save(bytes: Uint8Array, ext: string) {
    fs.mkdirSync(DIR(), { recursive: true });
    const name = `${crypto.randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(DIR(), name), bytes);
    return { url: `/api/uploads/${name}` };
  }
  async read(name: string) {
    if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(name)) return null;
    const file = path.join(DIR(), name);
    if (!fs.existsSync(file)) return null;
    return { bytes: fs.readFileSync(file), contentType: TYPES[name.split(".").pop()!] };
  }
}
export const getStorage = (): StorageProvider => new LocalStorage();

/** Content-type by magic bytes, never by the client's claim. */
export function sniffImage(b: Uint8Array): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

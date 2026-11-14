/**
 * Browser-side photo opening that works for every common phone/camera format.
 * Browsers decode JPEG, PNG, WebP, GIF, BMP and AVIF themselves. HEIC/HEIF (iPhone default) only decodes natively
 * in Safari, so elsewhere we convert it to JPEG on the device with `heic-to` (libheif, LGPL-3.0), loaded only when needed.
 */

export type ImageKind = "jpeg" | "png" | "webp" | "gif" | "bmp" | "avif" | "heic" | "tiff" | "unknown";

const HEIC_BRANDS = new Set(["heic", "heix", "heim", "heis", "hevc", "hevx", "hevm", "hevs", "mif1", "msf1", "mif2"]);
const AVIF_BRANDS = new Set(["avif", "avis"]);

/** Identify an image by its first bytes (file.type is often empty for HEIC on Chrome/Windows). */
export function sniffImageKind(b: Uint8Array): ImageKind {
  const s = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b[0] === 0x89 && s(1, 4) === "PNG") return "png";
  if (b.length >= 12 && s(0, 4) === "RIFF" && s(8, 12) === "WEBP") return "webp";
  if (b.length >= 6 && (s(0, 6) === "GIF87a" || s(0, 6) === "GIF89a")) return "gif";
  if (b.length >= 2 && s(0, 2) === "BM") return "bmp";
  if (b.length >= 4 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 0x2a))) return "tiff";
  if (b.length >= 12 && s(4, 8) === "ftyp") {
    // ISO-BMFF: major brand at 8..12, compatible brands after the minor version (16..box size)
    const size = Math.min(b.length, ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0 || 32);
    const brands = [s(8, 12)];
    for (let i = 16; i + 4 <= size; i += 4) brands.push(s(i, i + 4));
    if (brands.some((x) => AVIF_BRANDS.has(x))) return "avif";
    if (brands.some((x) => HEIC_BRANDS.has(x))) return "heic";
  }
  return "unknown";
}

export const UNSUPPORTED_PHOTO = "We couldn't open that photo. JPEG, PNG, HEIC (iPhone), WebP, AVIF and GIF all work. RAW camera files don't.";

/** File-picker filter: image/* alone hides .heic files on some desktop systems. */
export const PHOTO_ACCEPT = "image/*,.heic,.heif,.avif";

/**
 * Returns a Blob the current browser can display and draw: the original file when it decodes natively,
 * otherwise a JPEG converted on the device. Throws Error(UNSUPPORTED_PHOTO) when it can't be opened.
 */
export async function toDisplayableBlob(file: Blob): Promise<Blob> {
  const kind = sniffImageKind(new Uint8Array(await file.slice(0, 64).arrayBuffer()));
  if (kind !== "heic") {
    try { (await createImageBitmap(file)).close(); return file; } catch { throw new Error(UNSUPPORTED_PHOTO); }
  }
  // Safari decodes HEIC itself; try that first so we skip loading the converter.
  try { (await createImageBitmap(file)).close(); return file; } catch { /* convert below */ }
  try {
    const { heicTo } = await import("heic-to/next");
    return await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  } catch { throw new Error(UNSUPPORTED_PHOTO); }
}

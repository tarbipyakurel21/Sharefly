/**
 * Geometry for "Try it in a photo of your room".
 *
 * A single photo has no depth, so we estimate the camera instead: a phone held at about chest height,
 * tilted slightly down, with the lens from the photo's EXIF (35 mm-equivalent focal length) or a typical
 * phone main camera. With that camera, any tap on the floor maps to a real floor position, and the item is
 * drawn in true perspective at its real size. Marking a door (floor to top, known height) corrects the
 * camera height, which is the biggest unknown. All of this is an estimate and the UI says so.
 */

export type Pt = { x: number; y: number };
export type Line = { a: Pt; b: Pt };
/** Normalised device coords: x right, y up, both in [-1, 1] across the photo. */
export type Ndc = { x: number; y: number };
export type PhotoCamera = { heightM: number; pitchRad: number; vfovRad: number; aspect: number };

export const MIN_LINE_PX = 20;
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
/** Typical phone camera held at chest height. */
export const DEFAULT_CAMERA_HEIGHT_M = 1.4;
/** Main camera on most recent phones (iPhone, Pixel, Galaxy) is about 24-26 mm equivalent. */
export const DEFAULT_FOCAL_35MM = 26;
export const DEFAULT_PITCH_DEG = 8;
const HALF_DIAGONAL_35MM = Math.hypot(36, 24) / 2; // 21.63 mm

export const lineLength = (l: Line) => Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y);
export const clampToPhoto = (p: Pt, natural: { w: number; h: number }): Pt =>
  ({ x: Math.min(natural.w, Math.max(0, p.x)), y: Math.min(natural.h, Math.max(0, p.y)) });
export const toNdc = (p: Pt, natural: { w: number; h: number }): Ndc => ({ x: (p.x / natural.w) * 2 - 1, y: 1 - (p.y / natural.h) * 2 });

/** Vertical field of view for a photo of size w × h taken with a 35 mm-equivalent focal length (defined on the diagonal). */
export function verticalFov(focal35: number, w: number, h: number): number {
  const halfVertical = (HALF_DIAGONAL_35MM * h) / Math.hypot(w, h);
  return 2 * Math.atan(halfVertical / focal35);
}

/** World-space ray direction through an NDC point. Camera looks down -z, pitched down by pitchRad. */
export function rayDir(n: Ndc, cam: PhotoCamera) {
  const ty = Math.tan(cam.vfovRad / 2), tx = ty * cam.aspect;
  const sp = Math.sin(cam.pitchRad), cp = Math.cos(cam.pitchRad);
  // forward (0,-sp,-cp), up (0,cp,-sp), right (1,0,0)
  return { x: n.x * tx, y: -sp + n.y * ty * cp, z: -cp - n.y * ty * sp };
}

/** Where a point in the photo meets the floor, or null if it's at/above the horizon or absurdly far. */
export function floorHit(n: Ndc, cam: PhotoCamera, maxDistM = 15): { x: number; z: number } | null {
  const d = rayDir(n, cam);
  if (d.y >= -1e-4) return null;
  const t = cam.heightM / -d.y;
  const x = t * d.x, z = t * d.z;
  if (Math.hypot(x, z) > maxDistM) return null;
  return { x, z };
}

/** Where a floor point appears in the photo (inverse of floorHit). Null if it's behind the camera. */
export function projectFloor(p: { x: number; z: number }, cam: PhotoCamera): Ndc | null {
  const sp = Math.sin(cam.pitchRad), cp = Math.cos(cam.pitchRad);
  const ry = -cam.heightM;
  const depth = ry * -sp + p.z * -cp, up = ry * cp + p.z * -sp;
  if (depth <= 1e-6) return null;
  const ty = Math.tan(cam.vfovRad / 2), tx = ty * cam.aspect;
  return { x: p.x / (depth * tx), y: up / (depth * ty) };
}

/**
 * Solve the camera height from a vertical thing standing on the floor (bottom on the floor, known real height).
 * With slope s = rise/run of each ray: heightM = H / (1 - s_top / s_bottom). Null when the line can't be right.
 */
export function cameraHeightFromVertical(bottom: Ndc, top: Ndc, realHeightM: number, cam: PhotoCamera): number | null {
  if (!(realHeightM > 0)) return null;
  const slope = (n: Ndc) => { const d = rayDir(n, cam); return d.y / Math.hypot(d.x, d.z); };
  const sb = slope(bottom), st = slope(top);
  if (sb >= -1e-4 || st <= sb) return null; // bottom must be below the horizon, top above the bottom
  const h = realHeightM / (1 - st / sb);
  return h >= 0.2 && h <= 4 ? h : null;
}

/**
 * Read the 35 mm-equivalent focal length (EXIF tag 0xA405) from JPEG or HEIC bytes. Null if absent.
 * Works on both because each stores a standard TIFF/EXIF block after an "Exif\0\0" header.
 */
export function readFocal35(bytes: Uint8Array): number | null {
  const find = () => {
    for (let i = 0; i + 8 < bytes.length; i++) {
      if (bytes[i] === 0x45 && bytes[i + 1] === 0x78 && bytes[i + 2] === 0x69 && bytes[i + 3] === 0x66 && bytes[i + 4] === 0 && bytes[i + 5] === 0
        && ((bytes[i + 6] === 0x49 && bytes[i + 7] === 0x49) || (bytes[i + 6] === 0x4d && bytes[i + 7] === 0x4d))) return i + 6;
    }
    return -1;
  };
  const base = find();
  if (base < 0) return null;
  const le = bytes[base] === 0x49;
  const u16 = (o: number) => { const p = base + o; if (p + 2 > bytes.length) throw 0; return le ? bytes[p] | (bytes[p + 1] << 8) : (bytes[p] << 8) | bytes[p + 1]; };
  const u32 = (o: number) => { const p = base + o; if (p + 4 > bytes.length) throw 0; return (le ? (bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)) : ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3])) >>> 0; };
  const findTag = (ifd: number, tag: number) => {
    const n = u16(ifd);
    for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; if (u16(e) === tag) return e; }
    return -1;
  };
  try {
    const exifPtr = findTag(u32(4), 0x8769);
    if (exifPtr < 0) return null;
    const e = findTag(u32(exifPtr + 8), 0xa405);
    if (e < 0) return null;
    const v = u16(e + 2) === 3 ? u16(e + 8) : u32(e + 8); // SHORT, or LONG from odd writers
    return v >= 8 && v <= 300 ? v : null;
  } catch { return null; }
}

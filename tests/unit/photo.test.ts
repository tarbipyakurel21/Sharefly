import { describe, expect, it } from "vitest";
import { cameraHeightFromVertical, clampToPhoto, floorHit, readFocal35, toNdc, verticalFov, type Ndc, type PhotoCamera } from "@/lib/room/photo";

const rad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Independent pinhole projection of a world point into NDC for the same camera model. */
function project(p: { x: number; y: number; z: number }, cam: PhotoCamera): Ndc {
  const sp = Math.sin(cam.pitchRad), cp = Math.cos(cam.pitchRad);
  const rel = { x: p.x, y: p.y - cam.heightM, z: p.z };
  const depth = rel.y * -sp + rel.z * -cp; // along forward (0,-sp,-cp)
  const up = rel.y * cp + rel.z * -sp; // along up (0,cp,-sp)
  const ty = Math.tan(cam.vfovRad / 2), tx = ty * cam.aspect;
  return { x: rel.x / (depth * tx), y: up / (depth * ty) };
}

const portrait: PhotoCamera = { heightM: 1.55, pitchRad: rad(10), vfovRad: verticalFov(26, 3024, 4032), aspect: 3024 / 4032 };

describe("photo camera model", () => {
  it("derives field of view from the 35 mm-equivalent lens", () => {
    expect(toDeg(verticalFov(26, 3024, 4032))).toBeCloseTo(67.3, 0); // iPhone main camera, portrait: long side vertical
    expect(toDeg(verticalFov(26, 4032, 3024))).toBeCloseTo(52.7, 0); // landscape
    expect(verticalFov(13, 4032, 3024)).toBeGreaterThan(verticalFov(26, 4032, 3024)); // ultra-wide sees more
  });

  it("maps a tap on the floor back to the real floor point", () => {
    for (const w of [{ x: 0, z: -2 }, { x: 0.8, z: -3.5 }, { x: -1.2, z: -1.6 }]) {
      const hit = floorHit(project({ x: w.x, y: 0, z: w.z }, portrait), portrait)!;
      expect(hit.x).toBeCloseTo(w.x, 6);
      expect(hit.z).toBeCloseTo(w.z, 6);
    }
  });

  it("refuses taps at or above the horizon (walls, ceiling)", () => {
    const level = { ...portrait, pitchRad: 0 };
    expect(floorHit({ x: 0, y: 0 }, level)).toBeNull();
    expect(floorHit({ x: 0, y: 0.5 }, portrait)).toBeNull();
  });

  it("recovers the true camera height from a marked door, whatever the starting guess", () => {
    const door = { x: 0.6, z: -3 }, H = 2.032;
    const bottom = project({ ...door, y: 0 }, portrait), top = project({ ...door, y: H }, portrait);
    expect(cameraHeightFromVertical(bottom, top, H, { ...portrait, heightM: 1 })).toBeCloseTo(1.55, 6);
    expect(cameraHeightFromVertical(bottom, top, H, { ...portrait, heightM: 9 })).toBeCloseTo(1.55, 6);
  });

  it("rejects a reference line that can't be standing on the floor", () => {
    expect(cameraHeightFromVertical({ x: 0, y: 0.6 }, { x: 0, y: 0.9 }, 2, portrait)).toBeNull(); // bottom above horizon
    expect(cameraHeightFromVertical({ x: 0, y: -0.5 }, { x: 0, y: -0.8 }, 2, portrait)).toBeNull(); // upside down
    expect(cameraHeightFromVertical({ x: 0, y: -0.5 }, { x: 0, y: 0.2 }, 0, portrait)).toBeNull();
  });

  it("converts photo pixels to NDC and clamps to the photo", () => {
    expect(toNdc({ x: 500, y: 400 }, { w: 1000, h: 800 })).toEqual({ x: 0, y: 0 });
    expect(toNdc({ x: 0, y: 800 }, { w: 1000, h: 800 })).toEqual({ x: -1, y: -1 });
    expect(clampToPhoto({ x: -10, y: 2000 }, { w: 1000, h: 800 })).toEqual({ x: 0, y: 800 });
  });
});

/** Minimal JPEG-style EXIF: "Exif\0\0" + TIFF with IFD0 -> ExifIFD -> FocalLengthIn35mmFilm. */
function exifWithFocal(focal: number, le: boolean) {
  const t: number[] = [];
  const u16 = (v: number) => (le ? t.push(v & 255, v >> 8) : t.push(v >> 8, v & 255));
  const u32 = (v: number) => (le ? t.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, v >>> 24) : t.push(v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255));
  t.push(...(le ? [0x49, 0x49] : [0x4d, 0x4d])); u16(42); u32(8);
  u16(1); u16(0x8769); u16(4); u32(1); u32(26); u32(0); // IFD0 at 8, one entry, Exif IFD at 26
  u16(1); u16(0xa405); u16(3); u32(1); u16(focal); u16(0); u32(0); // Exif IFD
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 0, ...Buffer.from("Exif\0\0", "latin1"), ...t]);
}

describe("readFocal35", () => {
  it("reads the lens from EXIF in either byte order", () => {
    expect(readFocal35(exifWithFocal(26, true))).toBe(26);
    expect(readFocal35(exifWithFocal(13, false))).toBe(13);
  });
  it("returns null when there's no lens info or the data is broken", () => {
    expect(readFocal35(new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3]))).toBeNull();
    expect(readFocal35(exifWithFocal(26, true).slice(0, 30))).toBeNull();
    expect(readFocal35(exifWithFocal(2000, true))).toBeNull();
  });
});

describe("three.js camera matches the photo camera model", () => {
  it("projects a floor point to the same spot that floorHit maps back", async () => {
    const THREE = await import("three");
    const c = new THREE.PerspectiveCamera(toDeg(portrait.vfovRad), portrait.aspect, 0.05, 100);
    c.position.set(0, portrait.heightM, 0); c.rotation.set(-portrait.pitchRad, 0, 0); // as CameraRig does
    c.updateMatrixWorld(); c.updateProjectionMatrix();
    const v = new THREE.Vector3(0.7, 0, -2.4).project(c);
    const hit = floorHit({ x: v.x, y: v.y }, portrait)!;
    expect(hit.x).toBeCloseTo(0.7, 5);
    expect(hit.z).toBeCloseTo(-2.4, 5);
  });
});

describe("projectFloor", () => {
  it("is the inverse of floorHit", async () => {
    const { projectFloor } = await import("@/lib/room/photo");
    const p = { x: -0.4, z: -2.7 };
    const n = projectFloor(p, portrait)!;
    const back = floorHit(n, portrait)!;
    expect(back.x).toBeCloseTo(p.x, 6); expect(back.z).toBeCloseTo(p.z, 6);
    expect(projectFloor({ x: 0, z: 1 }, portrait)).toBeNull(); // behind the camera
  });
});

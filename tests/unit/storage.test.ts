import { afterEach, describe, expect, it, vi } from "vitest";
import { getStorage, LocalStorage, UploadThingStorage } from "@/lib/storage";
import { ListingBody } from "@/lib/validation";

const uploadFiles = vi.fn();
vi.mock("uploadthing/server", () => ({
  UTApi: class { uploadFiles = uploadFiles; },
  UTFile: class { constructor(public parts: unknown[], public name: string, public opts: unknown) {} },
}));

afterEach(() => { vi.unstubAllEnvs(); uploadFiles.mockReset(); });

describe("getStorage", () => {
  it("defaults to local disk", () => { vi.stubEnv("STORAGE_PROVIDER", ""); expect(getStorage()).toBeInstanceOf(LocalStorage); });
  it("falls back to local when uploadthing is chosen without a token", () => {
    vi.stubEnv("STORAGE_PROVIDER", "uploadthing"); vi.stubEnv("UPLOADTHING_TOKEN", "");
    expect(getStorage()).toBeInstanceOf(LocalStorage);
  });
  it("uses UploadThing when chosen and a token is set", () => {
    vi.stubEnv("STORAGE_PROVIDER", "uploadthing"); vi.stubEnv("UPLOADTHING_TOKEN", "x");
    expect(getStorage()).toBeInstanceOf(UploadThingStorage);
  });
});

describe("UploadThingStorage", () => {
  it("returns the CDN url", async () => {
    uploadFiles.mockResolvedValue({ data: { ufsUrl: "https://abc123.ufs.sh/f/key.jpg" }, error: null });
    expect(await new UploadThingStorage().save(new Uint8Array([1]), "jpg")).toEqual({ url: "https://abc123.ufs.sh/f/key.jpg" });
  });
  it("throws when UploadThing reports an error so the caller can show a friendly message", async () => {
    uploadFiles.mockResolvedValue({ data: null, error: { message: "nope" } });
    await expect(new UploadThingStorage().save(new Uint8Array([1]), "png")).rejects.toThrow();
  });
});

describe("photoUrl validation", () => {
  const photoRule = (u: string) => ListingBody.shape.photoUrl.safeParse(u).success;
  it("accepts local, seed and ufs.sh urls; rejects other hosts and http", () => {
    expect(photoRule("/seed/x.jpg")).toBe(true);
    expect(photoRule("https://abc123.ufs.sh/f/key.jpg")).toBe(true);
    expect(photoRule("https://evil.example.com/f/key.jpg")).toBe(false);
    expect(photoRule("http://abc123.ufs.sh/f/key.jpg")).toBe(false);
  });
});

import { sniffModel } from "@/lib/storage";
describe("sniffModel", () => {
  const zip = (name: string) => { const b = new Uint8Array(80); b.set([0x50, 0x4b, 3, 4], 0); b[26] = name.length; for (let i = 0; i < name.length; i++) b[30 + i] = name.charCodeAt(i); return b; };
  it("accepts GLB and USDZ by magic bytes", () => {
    expect(sniffModel(new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0]))?.ext).toBe("glb");
    expect(sniffModel(zip("scan.usdc"))?.ext).toBe("usdz");
    expect(sniffModel(zip("model.usda"))?.ext).toBe("usdz");
  });
  it("rejects ordinary zips, images and junk even if named .usdz", () => {
    expect(sniffModel(zip("notes.txt"))).toBeNull();
    expect(sniffModel(new Uint8Array(80).fill(1))).toBeNull();
    expect(sniffModel(new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
  });
});

import { ListingBody as LB } from "@/lib/validation";
describe("listing 3D model", () => {
  const base = { title: "Chair" };
  it("accepts a stored .usdz or .glb and rejects other hosts, formats and mismatched shapes", () => {
    expect(LB.safeParse({ ...base, model: { url: "/api/uploads/3f2a1b4c-0000-4000-8000-000000000000.usdz", format: "usdz" } }).success).toBe(true);
    expect(LB.safeParse({ ...base, model: { url: "https://evil.example/x.usdz", format: "usdz" } }).success).toBe(false);
    expect(LB.safeParse({ ...base, model: { url: "/api/uploads/3f2a1b4c-0000-4000-8000-000000000000.mp4", format: "usdz" } }).success).toBe(false);
    expect(LB.safeParse({ ...base, model: { url: "/api/uploads/3f2a1b4c-0000-4000-8000-000000000000.glb", format: "obj" } }).success).toBe(false);
    expect(LB.safeParse({ ...base, model: null }).success).toBe(true);
  });
});

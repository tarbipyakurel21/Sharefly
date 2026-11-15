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

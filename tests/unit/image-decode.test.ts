import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { sniffImageKind } from "@/lib/image-decode";

const head = (p: string) => new Uint8Array(readFileSync(p).subarray(0, 64));
const ftyp = (major: string, ...compat: string[]) => {
  const brands = [major, "\0\0\0\0", ...compat].join("");
  const size = 8 + brands.length;
  return new Uint8Array([0, 0, 0, size, ...Buffer.from("ftyp" + brands, "latin1")]);
};

describe("sniffImageKind", () => {
  it("recognises a real HEIC file (as written by macOS/iPhone)", () => {
    expect(sniffImageKind(head("tests/fixtures/desk.heic"))).toBe("heic");
  });
  it("recognises JPEG from the seed photos", () => {
    expect(sniffImageKind(head("public/seed/demo-desk.jpg"))).toBe("jpeg");
  });
  it("tells HEIF variants from AVIF", () => {
    expect(sniffImageKind(ftyp("mif1", "heic"))).toBe("heic");
    expect(sniffImageKind(ftyp("heix"))).toBe("heic");
    expect(sniffImageKind(ftyp("avif", "mif1"))).toBe("avif");
    expect(sniffImageKind(ftyp("mif1", "avif"))).toBe("avif");
  });
  it("recognises other common formats and rejects non-images", () => {
    expect(sniffImageKind(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]))).toBe("png");
    expect(sniffImageKind(Buffer.from("GIF89a......", "latin1"))).toBe("gif");
    expect(sniffImageKind(Buffer.from("RIFF\0\0\0\0WEBPVP8 ", "latin1"))).toBe("webp");
    expect(sniffImageKind(new Uint8Array([0x49, 0x49, 0x2a, 0]))).toBe("tiff");
    expect(sniffImageKind(Buffer.from("%PDF-1.7", "latin1"))).toBe("unknown");
    expect(sniffImageKind(ftyp("isom", "mp41"))).toBe("unknown"); // an MP4 video
  });
});

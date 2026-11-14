import { describe, it, expect } from "vitest";
import { ftToM, mToFt, parseLength, formatLength } from "@/lib/units";

describe("units", () => {
  it("round trips feet and meters", () => {
    for (const ft of [1, 9.5, 12, 30]) expect(mToFt(ftToM(ft))).toBeCloseTo(ft, 9);
  });
  it("parses feet formats", () => {
    expect(parseLength("12", "ft")).toBeCloseTo(3.6576, 4);
    expect(parseLength("12'6\"", "ft")).toBeCloseTo(ftToM(12.5), 4);
    expect(parseLength("12 ft 6 in", "ft")).toBeCloseTo(ftToM(12.5), 4);
    expect(parseLength("12-6", "ft")).toBeCloseTo(ftToM(12.5), 4);
  });
  it("rejects junk", () => {
    expect(parseLength("abc", "ft")).toBeNull();
    expect(parseLength("", "m")).toBeNull();
    expect(parseLength("-3", "m")).toBeNull();
    expect(parseLength("12'13\"", "ft")).toBeNull();
  });
  it("parses meters with comma", () => expect(parseLength("3,5", "m")).toBe(3.5));
  it("formats", () => {
    expect(formatLength(ftToM(12.5), "ft")).toBe("12 ft 6 in");
    expect(formatLength(3.456, "m")).toBe("3.46 m");
  });
});

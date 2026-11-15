import { describe, it, expect } from "vitest";
import { sanitizeSuggestion } from "@/lib/ai/validate";

describe("sanitizeSuggestion", () => {
  it("accepts a clean suggestion", () => {
    const s = sanitizeSuggestion({ title: "Wooden desk", category: "desk", description: "A wooden desk with two drawers." });
    expect(s?.description).toMatch(/drawers/);
  });
  it("drops descriptions with measurements", () => {
    expect(sanitizeSuggestion({ title: "Wooden desk", category: "desk", description: "A desk about 120 cm wide." })?.description).toBe("");
  });
  it("drops invented brand and condition", () => {
    expect(sanitizeSuggestion({ title: "IKEA desk", category: "desk", description: "In great condition." })).toEqual({ title: "Desk", category: "desk", description: "" });
  });
  it("rejects invalid shape or category", () => {
    expect(sanitizeSuggestion({ title: "x", category: "desk", description: "y" })).toBeNull();
    expect(sanitizeSuggestion({ title: "Thing", category: "spaceship", description: "y" })).toBeNull();
  });
});

import { getAIProvider } from "@/lib/ai/providers";
describe("provider selection", () => {
  const bytes = new Uint8Array([1, 2, 3]);
  it("none and missing key are unavailable, never a fake success", async () => {
    process.env.AI_PROVIDER = "none";
    expect(await getAIProvider().describeItem({ imageBytes: bytes, mimeType: "image/jpeg" })).toEqual({ status: "unavailable", reason: "no_provider" });
    process.env.AI_PROVIDER = "anthropic"; delete process.env.ANTHROPIC_API_KEY;
    expect(getAIProvider().name).toBe("none");
    process.env.AI_PROVIDER = "gemini"; delete process.env.GEMINI_API_KEY;
    expect(getAIProvider().name).toBe("none");
    process.env.GEMINI_API_KEY = "test-key";
    expect(getAIProvider().name).toBe("gemini");
    delete process.env.GEMINI_API_KEY; delete process.env.AI_PROVIDER;
  });
  it("gemini parses a candidate and sanitizes it; failures are unavailable", async () => {
    process.env.AI_PROVIDER = "gemini"; process.env.GEMINI_API_KEY = "test-key";
    const orig = globalThis.fetch;
    const reply = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }));
    try {
      globalThis.fetch = (async () => reply('{"title":"Wooden desk","category":"desk","description":"A wooden desk, about 120 cm wide."}')) as typeof fetch;
      expect(await getAIProvider().describeItem({ imageBytes: bytes, mimeType: "image/jpeg" })).toEqual({ status: "ok", source: "model", suggestion: { title: "Wooden desk", category: "desk", description: "" } });
      globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;
      expect(await getAIProvider().describeItem({ imageBytes: bytes, mimeType: "image/jpeg" })).toEqual({ status: "unavailable", reason: "error" });
      globalThis.fetch = (async () => reply("not json")) as typeof fetch;
      expect(await getAIProvider().describeItem({ imageBytes: bytes, mimeType: "image/jpeg" })).toEqual({ status: "unavailable", reason: "error" });
    } finally { globalThis.fetch = orig; delete process.env.GEMINI_API_KEY; delete process.env.AI_PROVIDER; }
  });
  it("mock is keyed on file name and says so", async () => {
    process.env.AI_PROVIDER = "mock";
    const r = await getAIProvider().describeItem({ imageBytes: bytes, mimeType: "image/jpeg", fileName: "demo-desk.jpg" });
    expect(r).toMatchObject({ status: "ok", source: "mock", suggestion: { category: "desk" } });
    delete process.env.AI_PROVIDER;
  });
});

import { sanitizeMeasurements } from "@/lib/ai/measurements";
describe("sanitizeMeasurements", () => {
  it("converts printed units to meters and keeps unknowns null", () => {
    expect(sanitizeMeasurements({ width: { value: 74, unit: "in" }, depth: { value: 90, unit: "cm" }, height: null }))
      .toEqual({ status: "ok", widthM: 1.88, depthM: 0.9, heightM: null, others: [], source: "model" });
  });
  it("rejects implausible sizes and non-JSON shapes instead of guessing", () => {
    expect(sanitizeMeasurements({ width: { value: 500, unit: "m" }, depth: null, height: null })).toEqual({ status: "unavailable", reason: "none_found" });
    expect(sanitizeMeasurements({ width: { value: -3, unit: "ft" } })).toEqual({ status: "unavailable", reason: "invalid" });
    expect(sanitizeMeasurements("hello")).toEqual({ status: "unavailable", reason: "invalid" });
  });
  it("mock and none providers never fabricate a size", async () => {
    for (const p of ["mock", "none"]) {
      process.env.AI_PROVIDER = p;
      expect(await getAIProvider().readMeasurements({ imageBytes: new Uint8Array([1]), mimeType: "image/png" })).toEqual({ status: "unavailable", reason: "no_provider" });
    }
    delete process.env.AI_PROVIDER;
  });
});

describe("custom measurements", () => {
  it("keeps labelled extras, drops bad labels, duplicates and implausible values", () => {
    const r = sanitizeMeasurements({ width: null, depth: null, height: null, other: [
      { label: "Seat height", value: 18, unit: "in" }, { label: "seat HEIGHT", value: 20, unit: "in" },
      { label: "<script>", value: 5, unit: "in" }, { label: "Huge", value: 900, unit: "m" }, "junk",
    ] });
    expect(r).toEqual({ status: "ok", widthM: null, depthM: null, heightM: null, others: [{ label: "Seat height", valueM: 0.457 }], source: "model" });
  });
  it("prompt only offers known labels as hints", async () => {
    const { measurePrompt } = await import("@/lib/ai/measurements");
    expect(measurePrompt(["Seat height"])).toContain("Seat height");
    expect(measurePrompt()).not.toContain("Names other people");
  });
});
import { ExtraMeasurementsInput } from "@/lib/validation";
describe("ExtraMeasurementsInput", () => {
  it("accepts named sizes and rejects blanks, duplicates, odd characters and over 8", () => {
    expect(ExtraMeasurementsInput.safeParse([{ label: "Diameter", valueM: 0.6 }]).success).toBe(true);
    expect(ExtraMeasurementsInput.safeParse([{ label: "", valueM: 1 }]).success).toBe(false);
    expect(ExtraMeasurementsInput.safeParse([{ label: "Leg", valueM: 1 }, { label: "leg", valueM: 2 }]).success).toBe(false);
    expect(ExtraMeasurementsInput.safeParse([{ label: "<b>x</b>", valueM: 1 }]).success).toBe(false);
    expect(ExtraMeasurementsInput.safeParse(Array.from({ length: 9 }, (_, i) => ({ label: `Part ${i}`, valueM: 1 }))).success).toBe(false);
  });
});

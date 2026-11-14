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
  });
  it("mock is keyed on file name and says so", async () => {
    process.env.AI_PROVIDER = "mock";
    const r = await getAIProvider().describeItem({ imageBytes: bytes, mimeType: "image/jpeg", fileName: "demo-desk.jpg" });
    expect(r).toMatchObject({ status: "ok", source: "mock", suggestion: { category: "desk" } });
    delete process.env.AI_PROVIDER;
  });
});

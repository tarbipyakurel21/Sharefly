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

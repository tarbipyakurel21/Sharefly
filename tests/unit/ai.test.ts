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

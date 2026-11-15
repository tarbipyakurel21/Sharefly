import { getEnv } from "@/lib/env";
import { categoriesIn } from "@/lib/matching/text";
import { CATEGORY_LABEL, CATEGORIES } from "@/lib/categories";
import type { AIProvider, DescribeResult, MeasurementResult } from "./types";
import { measurePrompt, sanitizeMeasurements } from "./measurements";
import { sanitizeSuggestion } from "./validate";

export const DESCRIBE_PROMPT = `You help a neighbor list an item they are giving away, from one photo.
Describe ONLY what is plainly visible: the type of item, its color, apparent material, and visible features.
NEVER state or guess condition, brand, manufacturer, model name, age, price, or any measurement.
NEVER use size words that imply measurement (large, compact, full-size, small, king, queen).
Write like a friendly neighbor: plain, warm, no sales language, no exclamation marks.
If you are unsure what the item is, use category "other" and a neutral title.
Return ONLY a JSON object: {"title": string (3-60 chars), "category": one of [${CATEGORIES.join(", ")}], "description": string (1-3 sentences about what is visible)}.`;

class NoneProvider implements AIProvider {
  readonly name = "none";
  async describeItem(): Promise<DescribeResult> { return { status: "unavailable", reason: "no_provider" }; }
  async readMeasurements(): Promise<MeasurementResult> { return { status: "unavailable", reason: "no_provider" }; }
}

/** Deterministic, keyed on the file name. For tests and as a demo safety net. Never claims a model looked at the photo. */
class MockProvider implements AIProvider {
  readonly name = "mock";
  async describeItem(input: { fileName?: string }): Promise<DescribeResult> {
    const cat = categoriesIn((input.fileName ?? "").replace(/[._-]/g, " "))[0] ?? "other";
    const label = CATEGORY_LABEL[cat];
    const suggestion = cat === "other"
      ? { title: "Item to give away", category: cat, description: "" }
      : { title: label, category: cat, description: `A ${label.toLowerCase()} shown in the photo.` };
    return { status: "ok", suggestion, source: "mock" };
  }
  /** The mock never fabricates a size. */
  async readMeasurements(): Promise<MeasurementResult> { return { status: "unavailable", reason: "no_provider" }; }
}

/** Shared timeout + retry + schema validation. Subclasses only implement the HTTP call. */
abstract class HttpVisionProvider implements AIProvider {
  abstract readonly name: string;
  protected abstract call(input: { imageBytes: Uint8Array; mimeType: string; prompt?: string }, signal: AbortSignal): Promise<unknown>;
  async describeItem(input: { imageBytes: Uint8Array; mimeType: string }): Promise<DescribeResult> {
    let lastTimeout = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12_000);
      try {
        const raw = await this.call(input, ctrl.signal);
        const suggestion = sanitizeSuggestion(raw);
        return suggestion ? { status: "ok", suggestion, source: "model" } : { status: "unavailable", reason: "invalid" };
      } catch (e) {
        lastTimeout = e instanceof Error && e.name === "AbortError";
      } finally { clearTimeout(timer); }
    }
    return { status: "unavailable", reason: lastTimeout ? "timeout" : "error" };
  }
  async readMeasurements(input: { imageBytes: Uint8Array; mimeType: string; knownLabels?: string[] }): Promise<MeasurementResult> {
    let lastTimeout = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12_000);
      try { return sanitizeMeasurements(await this.call({ imageBytes: input.imageBytes, mimeType: input.mimeType, prompt: measurePrompt(input.knownLabels) }, ctrl.signal)); }
      catch (e) { lastTimeout = e instanceof Error && e.name === "AbortError"; }
      finally { clearTimeout(timer); }
    }
    return { status: "unavailable", reason: lastTimeout ? "timeout" : "error" };
  }
}

function extractJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no json");
  return JSON.parse(m[0]);
}

class AnthropicProvider extends HttpVisionProvider {
  readonly name = "anthropic";
  protected async call(input: { imageBytes: Uint8Array; mimeType: string; prompt?: string }, signal: AbortSignal): Promise<unknown> {
    const env = getEnv();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL, max_tokens: 400,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: input.mimeType, data: Buffer.from(input.imageBytes).toString("base64") } },
          { type: "text", text: input.prompt ?? DESCRIBE_PROMPT },
        ] }],
      }),
    });
    if (!res.ok) throw new Error(`provider status ${res.status}`); // never include body/headers
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return extractJson(data.content?.find((c) => c.type === "text")?.text ?? "");
  }
}

class GeminiProvider extends HttpVisionProvider {
  readonly name = "gemini";
  protected async call(input: { imageBytes: Uint8Array; mimeType: string; prompt?: string }, signal: AbortSignal): Promise<unknown> {
    const env = getEnv();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;
    const res = await fetch(url, {
      method: "POST", signal,
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! }, // key in header, never in the URL
      body: JSON.stringify({
        contents: [{ parts: [
          { inline_data: { mime_type: input.mimeType, data: Buffer.from(input.imageBytes).toString("base64") } },
          { text: input.prompt ?? DESCRIBE_PROMPT },
        ] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2048 },
      }),
    });
    if (!res.ok) throw new Error(`provider status ${res.status}`); // never include body/headers
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return extractJson(data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ?? "");
  }
}

export function getAIProvider(): AIProvider {
  const env = getEnv();
  if (env.AI_PROVIDER === "mock") return new MockProvider();
  if (env.AI_PROVIDER === "anthropic" && env.ANTHROPIC_API_KEY) return new AnthropicProvider();
  if (env.AI_PROVIDER === "gemini" && env.GEMINI_API_KEY) return new GeminiProvider();
  return new NoneProvider();
}

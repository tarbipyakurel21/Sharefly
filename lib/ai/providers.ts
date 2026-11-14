import { getEnv } from "@/lib/env";
import { categoriesIn } from "@/lib/matching/text";
import { CATEGORY_LABEL, CATEGORIES } from "@/lib/categories";
import type { AIProvider, DescribeResult } from "./types";
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
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private async call(input: { imageBytes: Uint8Array; mimeType: string }, signal: AbortSignal): Promise<unknown> {
    const env = getEnv();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL, max_tokens: 400,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: input.mimeType, data: Buffer.from(input.imageBytes).toString("base64") } },
          { type: "text", text: DESCRIBE_PROMPT },
        ] }],
      }),
    });
    if (!res.ok) throw new Error(`provider status ${res.status}`); // never include body/headers
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("no json");
    return JSON.parse(m[0]);
  }
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
}

export function getAIProvider(): AIProvider {
  const env = getEnv();
  if (env.AI_PROVIDER === "mock") return new MockProvider();
  if (env.AI_PROVIDER === "anthropic" && env.ANTHROPIC_API_KEY) return new AnthropicProvider();
  return new NoneProvider();
}

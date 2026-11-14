import { CATEGORY_LABEL } from "@/lib/categories";
import { ItemSuggestionSchema, type ItemSuggestion } from "./types";

const BRANDS = ["ikea", "wayfair", "amazon", "walmart", "target", "ashley", "herman miller", "steelcase", "west elm", "pottery barn", "crate & barrel", "crate and barrel", "apple", "samsung", "sony", "dell", "lenovo", "hp", "lg", "bose", "dyson", "keurig", "cuisinart"];
const MEASURE = /\d+(?:[.,]\d+)?\s*(?:cm|mm|m|meters?|metres?|in|inch|inches|ft|feet|foot|"|')(?![a-z])/i;
const SIZE_WORDS = /\b(large|compact|full-size|full size|oversized|king|queen|twin|standard-size|small|tiny|huge)\b/i;
const CONDITION = /\b(like new|brand new|good condition|great condition|excellent condition|mint|barely used|gently used|lightly used|well[- ]kept|scratch(?:es|ed)?|no damage)\b/i;
const brandRe = new RegExp(`\\b(${BRANDS.map((b) => b.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&")).join("|")})\\b`, "i");

export const containsInvented = (s: string) => MEASURE.test(s) || SIZE_WORDS.test(s) || CONDITION.test(s) || brandRe.test(s);

/** Validate model output and strip anything that sounds like an invented fact. Returns null if unusable. */
export function sanitizeSuggestion(raw: unknown): ItemSuggestion | null {
  const parsed = ItemSuggestionSchema.safeParse(raw);
  if (!parsed.success) return null;
  const s = parsed.data;
  const title = containsInvented(s.title) ? `${CATEGORY_LABEL[s.category]}` : s.title.trim();
  const description = containsInvented(s.description) ? "" : s.description.trim();
  return { title: title.length >= 3 ? title : CATEGORY_LABEL[s.category], category: s.category, description: description || "" };
}

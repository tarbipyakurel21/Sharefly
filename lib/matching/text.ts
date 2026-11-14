import { SYNONYMS, type Category } from "@/lib/categories";

const STOP = new Set([
  "a", "an", "the", "for", "my", "me", "i", "in", "on", "of", "to", "and", "or", "with", "that", "is", "it",
  "need", "want", "looking", "find", "some", "any", "small", "sturdy", "good", "nice", "cheap", "free", "under",
  "within", "near", "mile", "miles", "km", "kilometer", "kilometers", "budget", "less", "than", "around", "about",
  "room", "preferably", "please", "would", "like", "have", "be", "at", "from",
]);

export function singular(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && /(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\$\s?\d+(\.\d+)?/g, " ")
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .map((t) => singular(t.replace(/^['-]+|['-]+$/g, "")))
    .filter((t) => t.length > 1);
}

/** Categories implied by the words (and two-word phrases) in the text. */
export function categoriesIn(text: string): Category[] {
  const toks = tokenize(text);
  const found = new Set<Category>();
  for (let i = 0; i < toks.length; i++) {
    const two = toks[i] + " " + toks[i + 1];
    if (SYNONYMS[two]) found.add(SYNONYMS[two]);
    if (SYNONYMS[toks[i]]) found.add(SYNONYMS[toks[i]]);
  }
  return [...found];
}

export function keywordsIn(text: string): string[] {
  const out: string[] = [];
  for (const t of tokenize(text)) {
    if (STOP.has(t) || STOP.has(t + "s")) continue;
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

/** Tokens of a listing text, plus the canonical category word for any synonym found. */
export function expandedTokens(text: string): Set<string> {
  const set = new Set(tokenize(text));
  for (const c of categoriesIn(text)) set.add(c);
  return set;
}

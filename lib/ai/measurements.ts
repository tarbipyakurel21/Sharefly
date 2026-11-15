import { z } from "zod";
import type { MeasurementResult } from "./types";

export const measurePrompt = (knownLabels: string[] = []) => `You read measurements from a screenshot taken in a measuring app (for example the iPhone Measure app or Reality Composer).
Only report numbers that are PRINTED as text in the image, with their unit. NEVER estimate a size from how the object looks.
If the image shows no printed measurement, or you cannot tell which number is width, depth or height, use null for that field.
Any other printed, labelled measurement (diameter, seat height, arm width...) goes in "other" with the label exactly as printed, at most 8 of them.${knownLabels.length ? `
Names other people have used, use one only when the printed label clearly means the same thing: ${knownLabels.slice(0, 15).join(", ")}.` : ""}
Return ONLY a JSON object: {"width": M, "depth": M, "height": M, "other": [{"label": string, "value": number, "unit": "in" | "ft" | "cm" | "m" | "mm"}]} where each M is null or {"value": number, "unit": "in" | "ft" | "cm" | "m" | "mm"}.
Convert feet-and-inches like 6' 2" to {"value": 74, "unit": "in"}.`;

const Reading = z.object({ value: z.number().positive(), unit: z.enum(["in", "ft", "cm", "m", "mm"]) }).nullable();
const OtherReading = z.object({ label: z.string().trim().min(2).max(30), value: z.number().positive(), unit: z.enum(["in", "ft", "cm", "m", "mm"]) });
const Schema = z.object({ width: Reading, depth: Reading, height: Reading, other: z.array(z.unknown()).max(20).optional() });

const TO_M = { in: 0.0254, ft: 0.3048, cm: 0.01, m: 1, mm: 0.001 } as const;
/** Anything outside 2 cm to 10 m is a misread, not furniture. */
const toMeters = (r: z.infer<typeof Reading>): number | null => {
  if (!r) return null;
  const m = r.value * TO_M[r.unit];
  return m >= 0.02 && m <= 10 ? Math.round(m * 1000) / 1000 : null;
};

export function sanitizeMeasurements(raw: unknown): MeasurementResult {
  const p = Schema.safeParse(raw);
  if (!p.success) return { status: "unavailable", reason: "invalid" };
  const widthM = toMeters(p.data.width), depthM = toMeters(p.data.depth), heightM = toMeters(p.data.height);
  const others: { label: string; valueM: number }[] = [];
  for (const o of p.data.other ?? []) {
    const r = OtherReading.safeParse(o);
    const valueM = r.success ? toMeters({ value: r.data.value, unit: r.data.unit }) : null;
    if (!r.success || valueM == null || !/^[\p{L}\p{N} ()\-/.']+$/u.test(r.data.label)) continue;
    if (others.some((x) => x.label.toLowerCase() === r.data.label.toLowerCase()) || others.length >= 8) continue;
    others.push({ label: r.data.label, valueM });
  }
  if (widthM == null && depthM == null && heightM == null && others.length === 0) return { status: "unavailable", reason: "none_found" };
  return { status: "ok", widthM, depthM, heightM, others, source: "model" };
}

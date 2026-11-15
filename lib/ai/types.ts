import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";

/** Deliberately no fields for condition, brand or dimensions: the model has nowhere to invent them. */
export const ItemSuggestionSchema = z.object({
  title: z.string().min(3).max(60),
  category: z.enum(CATEGORIES),
  description: z.string().min(1).max(400),
});
export type ItemSuggestion = z.infer<typeof ItemSuggestionSchema>;

export type DescribeResult =
  | { status: "ok"; suggestion: ItemSuggestion; source: "model" | "mock" }
  | { status: "unavailable"; reason: "no_provider" | "timeout" | "error" | "invalid" };

export type MeasurementResult =
  | { status: "ok"; widthM: number | null; depthM: number | null; heightM: number | null; others: { label: string; valueM: number }[]; source: "model" }
  | { status: "unavailable"; reason: "no_provider" | "timeout" | "error" | "invalid" | "none_found" };

export interface AIProvider {
  readonly name: string;
  describeItem(input: { imageBytes: Uint8Array; mimeType: string; fileName?: string }): Promise<DescribeResult>;
  /** Reads numbers printed in a screenshot (Measure app, Reality Composer). Never estimates from how the item looks. */
  readMeasurements(input: { imageBytes: Uint8Array; mimeType: string; knownLabels?: string[] }): Promise<MeasurementResult>;
}

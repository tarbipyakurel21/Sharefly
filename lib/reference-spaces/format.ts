import type { ReferenceSpace } from "./types";

export function rentLabel(s: Pick<ReferenceSpace, "minRentUsd" | "maxRentUsd" | "rentBasis">): string {
  if (s.minRentUsd == null) return "Rent not provided";
  const per = s.rentBasis === "bed" ? " per bed" : s.rentBasis === "bedroom" ? " per bedroom" : "";
  const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
  const range = s.maxRentUsd && s.maxRentUsd !== s.minRentUsd ? `${usd(s.minRentUsd)}–${usd(s.maxRentUsd)}` : usd(s.minRentUsd);
  return `${range}/mo${per} (asking)`;
}
export const bedsLabel = (beds: number | null) => (beds == null ? "Beds not provided" : beds === 0 ? "Studio" : `${beds} bed`);
export const sqftLabel = (s: Pick<ReferenceSpace, "minSqft" | "maxSqft">) =>
  s.minSqft == null ? "Size not provided" : s.maxSqft && s.maxSqft !== s.minSqft ? `${s.minSqft}–${s.maxSqft} sq ft` : `${s.minSqft} sq ft`;
export const milesFromFeet = (ft: number) => Math.round((ft / 5280) * 10) / 10;

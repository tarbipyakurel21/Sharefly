export type Unit = "ft" | "m";
export const FT_PER_M = 3.280839895;
export const M_PER_FT = 0.3048;

export const ftToM = (ft: number) => ft * M_PER_FT;
export const mToFt = (m: number) => m / M_PER_FT;

/**
 * Parse a length typed by a person into meters.
 * Feet mode accepts: 12, 12.5, 12'6", 12' 6, 12 ft 6 in, 12-6.
 * Meter mode accepts decimals (comma or dot).
 */
export function parseLength(input: string, unit: Unit): number | null {
  const s = input.trim().toLowerCase().replace(",", ".");
  if (!s) return null;
  if (unit === "m") {
    if (!/^\d+(\.\d+)?\s*(m|meters?|metres?)?$/.test(s)) return null;
    const v = parseFloat(s);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  const feetInches = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet|foot|-)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/);
  if (feetInches) {
    const ft = parseFloat(feetInches[1]);
    const inch = feetInches[2] ? parseFloat(feetInches[2]) : 0;
    if (inch >= 12) return null;
    return ftToM(ft + inch / 12);
  }
  if (/^\d+(\.\d+)?$/.test(s)) {
    const v = parseFloat(s);
    return v > 0 ? ftToM(v) : null;
  }
  return null;
}

export function formatLength(m: number, unit: Unit): string {
  if (unit === "m") return `${round(m, 2)} m`;
  const totalIn = Math.round((m / M_PER_FT) * 12);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  return inch === 0 ? `${ft} ft` : `${ft} ft ${inch} in`;
}

export function round(n: number, digits = 2) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

import type { Level, ReviewStatus } from "./types";

export const LEVEL_LABEL: Record<Level, string> = {
  high: "High suspicion",
  medium: "Medium suspicion",
  low: "Low suspicion",
};

export const LEVEL_COLOR: Record<Level, string> = {
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#8fa3bf",
};

export const LEVEL_BADGE: Record<Level, string> = {
  high: "bg-orange-400/15 text-orange-300 ring-orange-400/40",
  medium: "bg-amber-400/15 text-amber-300 ring-amber-400/40",
  low: "bg-slate-400/15 text-slate-300 ring-slate-400/40",
};

/** Links are shown defanged so nobody clicks or copies a live URL by accident. */
export const defang = (url: string) => url.replace(/^http/i, "hxxp").replace(/\./g, "[.]");

/** Defang only the links inside free text, leaving the rest of the sentence untouched. */
export const defangText = (text: string) => text.replace(/https?:\/\/[^\s<>"')\]]+/gi, defang);

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

export const REVIEW_BADGE: Record<ReviewStatus, string> = {
  needs_review: "bg-sky-400/10 text-sky-200 ring-sky-400/30",
  escalated: "bg-violet-400/15 text-violet-200 ring-violet-400/40",
  dismissed: "bg-emerald-400/10 text-emerald-200 ring-emerald-400/30",
};

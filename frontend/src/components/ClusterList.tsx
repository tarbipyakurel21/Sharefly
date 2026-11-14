import { LEVEL_BADGE, LEVEL_COLOR, LEVEL_LABEL, REVIEW_BADGE } from "../format";
import type { Analysis, Cluster } from "../types";

interface Props {
  clusters: Cluster[];
  statuses: Analysis["review_statuses"];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function ClusterList({ clusters, statuses, selectedId, onSelect }: Props) {
  if (clusters.length === 0) {
    return (
      <p className="p-4 text-sm text-slate-400">
        No coordination patterns matched the current rules. That does not mean every message is safe.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2 p-3">
      {clusters.map((c) => {
        const active = c.id === selectedId;
        return (
          <li key={c.id}>
            <button
              onClick={() => onSelect(active ? null : c.id)}
              aria-pressed={active}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                c.review.status === "dismissed" ? "opacity-60 " : ""
              }${
                active ? "border-sky-400/70 bg-ink-700" : "border-line bg-ink-800 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-slate-100">Cluster {c.id}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${LEVEL_BADGE[c.level]}`}>
                  {LEVEL_LABEL[c.level]}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-950">
                  <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: LEVEL_COLOR[c.level] }} />
                </div>
                <span className="w-12 text-right font-mono text-xs text-slate-300">{c.score}/100</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {c.message_ids.length} messages · {c.accounts.length} accounts · {c.evidence.length}{" "}
                {c.evidence.length === 1 ? "signal" : "signals"}
              </p>
              <span
                className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[11px] ring-1 ${REVIEW_BADGE[c.review.status]}`}
              >
                {statuses[c.review.status]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

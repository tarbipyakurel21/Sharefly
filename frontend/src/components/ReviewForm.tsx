import { useEffect, useState } from "react";
import { formatTime } from "../format";
import type { Analysis, Cluster, ReviewStatus } from "../types";

interface Props {
  cluster: Cluster;
  statuses: Analysis["review_statuses"];
  reportUrl: string;
  onSave: (status: ReviewStatus, note: string) => Promise<void>;
}

/** Records the analyst's decision. Deliberately offers no "confirmed fraud" option. */
export default function ReviewForm({ cluster, statuses, reportUrl, onSave }: Props) {
  const [status, setStatus] = useState(cluster.review.status);
  const [note, setNote] = useState(cluster.review.note);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(cluster.review.status);
    setNote(cluster.review.note);
  }, [cluster.key, cluster.review.status, cluster.review.note]);

  const dirty = status !== cluster.review.status || note.trim() !== cluster.review.note;

  return (
    <div className="rounded-lg border border-line bg-ink-800 p-3" data-testid="review-form">
      <div className="grid grid-cols-3 gap-1 rounded-md bg-ink-950 p-1">
        {(Object.keys(statuses) as ReviewStatus[]).map((key) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            aria-pressed={status === key}
            className={`rounded px-1.5 py-1.5 text-[11px] leading-tight transition ${
              status === key ? "bg-sky-500 font-medium text-ink-950" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {statuses[key]}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        rows={2}
        placeholder="Analyst note (what was checked, who was contacted...)"
        className="mt-2 w-full resize-y rounded-md border border-line bg-ink-950 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          {cluster.review.updated_at ? `Saved ${formatTime(cluster.review.updated_at)} UTC` : "Not reviewed yet"}
        </span>
        <div className="flex items-center gap-3">
          <a href={reportUrl} className="text-xs text-sky-300 hover:underline">
            Download report
          </a>
          <button
            disabled={!dirty || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(status, note);
              } finally {
                setSaving(false);
              }
            }}
            className="rounded-md bg-sky-500 px-3 py-1 text-xs font-medium text-ink-950 hover:bg-sky-400 disabled:opacity-40"
          >
            {saving ? "Saving" : "Save review"}
          </button>
        </div>
      </div>
    </div>
  );
}

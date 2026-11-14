import { LEVEL_BADGE, LEVEL_COLOR, LEVEL_LABEL, defang, formatTime } from "../format";
import type { Analysis, Cluster, MessageRow, ReviewStatus } from "../types";
import ReviewForm from "./ReviewForm";
import WordingCompare from "./WordingCompare";

const Chip = ({ children }: { children: string }) => (
  <span className="rounded bg-ink-950 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">{children}</span>
);

const Heading = ({ children }: { children: string }) => (
  <h4 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{children}</h4>
);

function RulesOverview({ config }: { config: Analysis["config"] }) {
  const rules = [
    ["Same link", "Two or more accounts sent the same link."],
    ["Similar wording", `Messages from different accounts share at least ${Math.round(config.similarity_threshold * 100)}% of their words.`],
    ["Close timing", `Messages already linked by one of the rules above were sent within ${config.time_window_minutes} minutes. Timing alone never links messages.`],
    ["Several accounts", "Three or more accounts appear in one cluster."],
  ];
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-slate-100">How clusters are flagged</h3>
      <p className="mt-1 text-sm text-slate-400">
        Select a cluster to see the evidence behind it. Every flag comes from these transparent rules:
      </p>
      <dl className="mt-4 space-y-3">
        {rules.map(([name, text]) => (
          <div key={name} className="rounded-lg border border-line bg-ink-800 px-3 py-2.5">
            <dt className="text-sm font-medium text-slate-200">{name}</dt>
            <dd className="mt-0.5 text-xs leading-relaxed text-slate-400">{text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface Props {
  cluster: Cluster | null;
  analysis: Analysis;
  reportUrl: string;
  onSaveReview: (status: ReviewStatus, note: string) => Promise<void>;
}

export default function EvidencePanel({ cluster, analysis, reportUrl, onSaveReview }: Props) {
  if (!cluster) return <RulesOverview config={analysis.config} />;
  const members: MessageRow[] = analysis.messages.filter((m) => m.cluster_id === cluster.id);
  return (
    <div className="p-4" data-testid="evidence-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-base font-semibold text-slate-100">Cluster {cluster.id}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${LEVEL_BADGE[cluster.level]}`}>
          {LEVEL_LABEL[cluster.level]}
        </span>
      </div>
      <p className="mt-2 inline-flex items-center gap-1.5 rounded border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-xs text-sky-200">
        Suspicious · not confirmed
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{cluster.summary}</p>
      <p className="mt-1 text-[11px] text-slate-500">
        Summary source: {cluster.summary_source} · Active {formatTime(cluster.first_seen)} to{" "}
        {formatTime(cluster.last_seen)} UTC
      </p>

      <Heading>Analyst review</Heading>
      <ReviewForm cluster={cluster} statuses={analysis.review_statuses} reportUrl={reportUrl} onSave={onSaveReview} />

      <Heading>Why this was flagged</Heading>
      <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-ink-950">
        {cluster.evidence.map((e, i) => (
          <div
            key={e.rule}
            title={`${e.title}: +${e.points}`}
            style={{ width: `${e.points}%`, background: LEVEL_COLOR[cluster.level], opacity: 1 - i * 0.2 }}
            className="border-r border-ink-900"
          />
        ))}
      </div>
      <ol className="space-y-2">
        {cluster.evidence.map((e) => (
          <li key={e.rule} className="rounded-lg border border-line bg-ink-800 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-slate-100">{e.title}</span>
              <span className="shrink-0 font-mono text-xs text-slate-400">+{e.points}</span>
            </div>
            <p className="mt-1 break-words text-xs leading-relaxed text-slate-400">
              {e.rule === "shared_url" ? defang(e.detail) : e.detail}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {e.message_ids.map((id) => (
                <Chip key={id}>{id}</Chip>
              ))}
            </div>
            {e.rule === "similar_text" && <WordingCompare evidence={e} messages={members} />}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-right font-mono text-xs text-slate-400">Suspicion score {cluster.score}/100</p>

      <Heading>Accounts involved</Heading>
      <div className="flex flex-wrap gap-1">
        {cluster.accounts.map((a) => (
          <Chip key={a}>{a}</Chip>
        ))}
      </div>

      {cluster.urls.length > 0 && (
        <>
          <Heading>Shared links (defanged)</Heading>
          <div className="flex flex-col gap-1">
            {cluster.urls.map((u) => (
              <span key={u} className="break-all font-mono text-[11px] text-violet-300">
                {defang(u)}
              </span>
            ))}
          </div>
        </>
      )}

      <Heading>What this does not establish</Heading>
      <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-400">
        {cluster.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

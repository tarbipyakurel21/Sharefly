import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "./api";
import ClusterList from "./components/ClusterList";
import EvidencePanel from "./components/EvidencePanel";
import GraphView from "./components/GraphView";
import MessageTable from "./components/MessageTable";
import UploadZone from "./components/UploadZone";
import type { Analysis, Dataset, ReviewStatus, ValidationReport } from "./types";

const DISCLAIMER =
  "Flags are investigative leads based on message patterns. They are not findings of fraud, and every cluster needs human review.";

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-ink-900 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${accent ? "text-orange-300" : "text-slate-100"}`}>{value}</p>
    </div>
  );
}

function ValidationNotice({ report, onClose }: { report: ValidationReport; onClose: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm" data-testid="validation">
      <div className="flex items-center justify-between">
        <p className="text-slate-200">
          CSV validated: <span className="font-mono text-emerald-300">{report.accepted}</span> of {report.total_rows} rows
          accepted
          {report.rejected > 0 && (
            <>
              , <span className="font-mono text-amber-300">{report.rejected}</span> rejected
            </>
          )}
          .
        </p>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">
          Dismiss
        </button>
      </div>
      {report.errors.length > 0 && (
        <ul className="mt-2 max-h-32 space-y-1 overflow-auto font-mono text-xs text-amber-200/90">
          {report.errors.map((e) => (
            <li key={e.row}>
              Row {e.row}: {e.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [storage, setStorage] = useState<{ backend: string; note: string | null } | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const openDataset = useCallback(async (id: number) => {
    setSelected(null);
    setAnalysis(await api.analysis(id));
  }, []);

  /** Run an API action with shared busy/error handling. */
  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      if (e instanceof ApiError && e.validation) setValidation(e.validation);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    run(async () => {
      try {
        setStorage((await api.health()).storage);
        setBackendUp(true);
      } catch (e) {
        setBackendUp(false);
        throw e;
      }
      const list = await api.listDatasets();
      setDatasets(list);
      if (list.length > 0) await openDataset(list[0].id);
    });
  }, [run, openDataset]);

  const ingest = (source: () => ReturnType<typeof api.upload>) =>
    run(async () => {
      setValidation(null);
      const result = await source();
      setValidation(result.validation);
      setDatasets(await api.listDatasets());
      await openDataset(result.dataset.id);
    });

  const cluster = analysis?.clusters.find((c) => c.id === selected) ?? null;

  const saveReview = async (status: ReviewStatus, note: string) => {
    if (!analysis || !cluster) return;
    const datasetId = analysis.dataset.id;
    await run(async () => {
      await api.setReview(datasetId, cluster.key, status, note);
      setAnalysis(await api.analysis(datasetId)); // keeps the current selection
    });
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-ink-900 px-5">
        <div className="flex items-center gap-3">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <path d="M7 7 L19 8 L13 20 Z" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="7" cy="7" r="3" fill="#38bdf8" />
            <circle cx="19" cy="8" r="3" fill="#a78bfa" />
            <circle cx="13" cy="20" r="3" fill="#fb923c" />
          </svg>
          <h1 className="text-[15px] font-semibold tracking-tight text-slate-50">PatternWitness</h1>
          <span className="hidden text-xs text-slate-500 md:inline">Coordinated scam campaign investigation</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${
                backendUp === null ? "bg-slate-500" : backendUp ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            {backendUp === null ? "Connecting" : backendUp ? "API connected" : "API offline"}
          </span>
          {storage && (
            <span
              title={storage.note ?? undefined}
              data-testid="storage"
              className="rounded border border-line bg-ink-800 px-2 py-1 text-[11px] text-slate-300"
            >
              Storage: {storage.backend === "mongodb" ? "MongoDB Atlas" : "SQLite (local)"}
              {storage.note && <span className="ml-1 text-amber-300">fallback</span>}
            </span>
          )}
          {datasets.length > 0 && (
            <select
              aria-label="Dataset"
              value={analysis?.dataset.id ?? ""}
              onChange={(e) => run(() => openDataset(Number(e.target.value)))}
              className="max-w-56 rounded-md border border-line bg-ink-800 px-2 py-1.5 text-xs text-slate-200"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} {d.name} ({d.message_count})
                </option>
              ))}
            </select>
          )}
          {analysis && (
            <>
              <button
                disabled={busy}
                onClick={() => ingest(api.loadSample)}
                className="rounded-md border border-line bg-ink-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-ink-700 disabled:opacity-50"
              >
                Load demo data
              </button>
              <button
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-sky-400 disabled:opacity-50"
              >
                Upload CSV
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) ingest(() => api.upload(file));
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>
      </header>

      <div className="border-b border-sky-400/20 bg-sky-400/5 px-5 py-2 text-xs text-sky-100/90">
        <strong className="font-semibold">Suspicious is not confirmed.</strong> {DISCLAIMER}
      </div>

      <main className="flex flex-1 flex-col gap-4 p-5">
        {error && (
          <div role="alert" className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
            {backendUp === false && (
              <span className="mt-1 block font-mono text-xs text-rose-200/80">
                Start it with: cd backend &amp;&amp; uvicorn app.main:app --reload --port 8000
              </span>
            )}
          </div>
        )}
        {validation && <ValidationNotice report={validation} onClose={() => setValidation(null)} />}

        {!analysis ? (
          backendUp !== null && (
            <UploadZone busy={busy} onFile={(f) => ingest(() => api.upload(f))} onLoadSample={() => ingest(api.loadSample)} />
          )
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatTile label="Messages" value={analysis.stats.messages} />
              <StatTile label="Accounts" value={analysis.stats.accounts} />
              <StatTile label="Distinct links" value={analysis.stats.urls} />
              <StatTile label="Flagged clusters" value={analysis.stats.clusters} accent />
              <StatTile label="Messages in clusters" value={analysis.stats.flagged_messages} accent />
            </div>

            <section className="rounded-xl border border-sky-400/20 bg-sky-400/5 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-100">Why combine signals?</h2>
                <span className="text-xs text-sky-100/70">Deterministic ablation on this dataset</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {analysis.signal_comparison.map((item) => (
                  <div key={item.label} className="rounded-lg border border-line bg-ink-900 px-3 py-2">
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="mt-1 font-mono text-lg text-slate-100">{item.clusters} clusters</p>
                    <p className="text-[11px] text-slate-500">{item.flagged_messages} messages linked</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 xl:h-[600px] xl:grid-cols-[280px_minmax(0,1fr)_380px]">
              <section className="flex min-h-0 flex-col rounded-xl border border-line bg-ink-900">
                <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-slate-100">
                  Flagged clusters <span className="ml-1 font-normal text-slate-500">for review</span>
                </h2>
                <div className="min-h-0 flex-1 overflow-auto">
                  <ClusterList
                    clusters={analysis.clusters}
                    statuses={analysis.review_statuses}
                    selectedId={selected}
                    onSelect={setSelected}
                  />
                </div>
              </section>
              <section className="flex min-h-[420px] flex-col rounded-xl border border-line bg-ink-900">
                <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-slate-100">
                  Relationship graph <span className="ml-1 font-normal text-slate-500">accounts, messages and links</span>
                </h2>
                <div className="min-h-0 flex-1">
                  <GraphView
                    graph={analysis.graph}
                    clusters={analysis.clusters}
                    selectedClusterId={selected}
                    onSelectCluster={setSelected}
                  />
                </div>
              </section>
              <section className="flex min-h-0 flex-col rounded-xl border border-line bg-ink-900">
                <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-slate-100">Evidence</h2>
                <div className="min-h-0 flex-1 overflow-auto">
                  <EvidencePanel
                    cluster={cluster}
                    analysis={analysis}
                    reportUrl={cluster ? api.reportUrl(analysis.dataset.id, cluster.key) : ""}
                    onSaveReview={saveReview}
                  />
                </div>
              </section>
            </div>

            <MessageTable
              messages={analysis.messages}
              clusters={analysis.clusters}
              selectedClusterId={selected}
              onSelectCluster={setSelected}
            />
          </>
        )}
      </main>
    </div>
  );
}

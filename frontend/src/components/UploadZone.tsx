import { useRef, useState } from "react";

interface Props {
  busy: boolean;
  onFile: (file: File) => void;
  onLoadSample: () => void;
}

/** Empty-state panel: drag a CSV in, browse for one, or load the synthetic demo data. */
export default function UploadZone({ busy, onFile, onLoadSample }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        className={`rounded-2xl border-2 border-dashed px-8 py-12 text-center transition ${
          over ? "border-sky-400 bg-sky-400/5" : "border-line bg-ink-900"
        }`}
      >
        <h2 className="text-lg font-semibold text-slate-100">Start an investigation</h2>
        <p className="mt-2 text-sm text-slate-400">
          Drop a CSV of reported messages here, or load the synthetic demo dataset.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            disabled={busy}
            onClick={() => input.current?.click()}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-sky-400 disabled:opacity-50"
          >
            Choose CSV file
          </button>
          <button
            disabled={busy}
            onClick={onLoadSample}
            className="rounded-lg border border-line bg-ink-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-ink-700 disabled:opacity-50"
          >
            Load demo data
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <div className="mt-4 rounded-xl border border-line bg-ink-900 px-5 py-4 text-sm text-slate-400">
        <p className="font-medium text-slate-200">CSV format</p>
        <p className="mt-1">
          Required columns: <code className="font-mono text-xs text-sky-200">message_id, sender_id, timestamp, message_text</code>.
          Optional: <code className="font-mono text-xs text-sky-200">urls</code> (separate several with a semicolon).
          Timestamps use ISO 8601, for example <code className="font-mono text-xs text-sky-200">2026-11-09T14:02:00Z</code>.
        </p>
        <a href="/api/sample-csv" className="mt-2 inline-block text-sky-300 hover:underline">
          Download the sample CSV
        </a>
      </div>
    </div>
  );
}

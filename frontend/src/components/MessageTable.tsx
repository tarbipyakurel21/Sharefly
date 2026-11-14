import { LEVEL_COLOR, defangText, formatTime } from "../format";
import type { Cluster, MessageRow } from "../types";

interface Props {
  messages: MessageRow[];
  clusters: Cluster[];
  selectedClusterId: string | null;
  onSelectCluster: (id: string | null) => void;
}

export default function MessageTable({ messages, clusters, selectedClusterId, onSelectCluster }: Props) {
  const levelOf = new Map(clusters.map((c) => [c.id, c.level]));
  const rows = selectedClusterId ? messages.filter((m) => m.cluster_id === selectedClusterId) : messages;
  return (
    <section className="rounded-xl border border-line bg-ink-900">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">
          {selectedClusterId ? `Messages in cluster ${selectedClusterId}` : "All messages"}
          <span className="ml-2 font-normal text-slate-500">{rows.length}</span>
        </h2>
        {selectedClusterId && (
          <button onClick={() => onSelectCluster(null)} className="text-xs text-sky-300 hover:underline">
            Show all messages
          </button>
        )}
      </header>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-ink-900 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Time (UTC)</th>
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Sender</th>
              <th className="px-4 py-2 font-medium">Message</th>
              <th className="px-4 py-2 font-medium">Cluster</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((m) => (
              <tr key={m.message_id} className="align-top hover:bg-ink-800/60">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-400">{formatTime(m.timestamp)}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{m.message_id}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-sky-200">{m.sender_id}</td>
                <td className="px-4 py-2.5 text-slate-300">
                  {defangText(m.text)}
                </td>
                <td className="px-4 py-2.5">
                  {m.cluster_id ? (
                    <button
                      onClick={() => onSelectCluster(m.cluster_id)}
                      className="rounded px-1.5 py-0.5 font-mono text-xs ring-1"
                      style={{ color: LEVEL_COLOR[levelOf.get(m.cluster_id) ?? "low"] }}
                    >
                      {m.cluster_id}
                    </button>
                  ) : (
                    <span className="whitespace-nowrap text-xs text-slate-600">not flagged</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

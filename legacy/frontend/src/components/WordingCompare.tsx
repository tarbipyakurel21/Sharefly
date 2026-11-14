import { defangText } from "../format";
import type { Evidence, MessageRow } from "../types";

const words = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9$]+/g) ?? []);

/** One message with the words that do NOT appear in the other message highlighted. */
function Side({ message, other }: { message: MessageRow; other: Set<string> }) {
  const parts = defangText(message.text).split(/(\s+)/);
  return (
    <div className="rounded border border-line bg-ink-950 p-2">
      <p className="mb-1 font-mono text-[11px] text-sky-200">
        {message.message_id} · {message.sender_id}
      </p>
      <p className="text-xs leading-relaxed text-slate-400">
        {parts.map((part, i) => {
          const key = part.toLowerCase().match(/[a-z0-9$]+/g)?.join("") ?? "";
          const differs = key !== "" && !/^hxxp/i.test(part) && !other.has(key);
          return differs ? (
            <mark key={i} className="rounded bg-amber-400/25 px-0.5 text-amber-100">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </p>
    </div>
  );
}

/** Side-by-side view of the most similar message pair behind a "similar wording" signal. */
export default function WordingCompare({ evidence, messages }: { evidence: Evidence; messages: MessageRow[] }) {
  const pairs = evidence.data.pairs ?? [];
  if (pairs.length === 0) return null;
  const best = pairs.reduce((top, p) => ((p.similarity ?? 0) > (top.similarity ?? 0) ? p : top));
  const a = messages.find((m) => m.message_id === best.a);
  const b = messages.find((m) => m.message_id === best.b);
  if (!a || !b) return null;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-sky-300 hover:underline">
        Compare the closest pair ({Math.round((best.similarity ?? 0) * 100)}% shared wording)
      </summary>
      <div className="mt-2 grid gap-2">
        <Side message={a} other={words(b.text)} />
        <Side message={b} other={words(a.text)} />
        <p className="text-[11px] text-slate-500">Highlighted words appear in only one of the two messages.</p>
      </div>
    </details>
  );
}

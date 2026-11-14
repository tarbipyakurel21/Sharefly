"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import type { Wishlist } from "@/lib/db/types";
import { kmToMiles } from "@/lib/geo/neighborhoods";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function WishlistList({ items, counts }: { items: Wishlist[]; counts: Record<string, number> }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function call(id: string, fn: () => Promise<unknown>, msg: string) {
    setBusy(id);
    try { await fn(); toast({ message: msg }); router.refresh(); } catch (e) { toast({ message: errMsg(e), tone: "error" }); } finally { setBusy(null); }
  }
  return (
    <ul className="space-y-3">
      {items.map((w) => (
        <li key={w.id} className={`rounded-2xl border border-line bg-surface p-4 ${w.active ? "" : "opacity-70"}`}>
          {editing === w.id ? (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); call(w.id, () => api(`/api/wishlists/${w.id}`, { method: "PATCH", json: { rawText: text } }).then(() => setEditing(null)), "Wishlist updated."); }}>
              <TextInput aria-label="Edit wishlist" value={text} onChange={(e) => setText(e.target.value)} />
              <Button type="submit" loading={busy === w.id}>Save</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </form>
          ) : (
            <>
              <p className="font-medium">{w.rawText}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {w.categories.map((c) => <Chip key={c} tone="accent">{c}</Chip>)}
                {w.maxPriceCents !== null && <Chip>{w.maxPriceCents === 0 ? "Free only" : `Up to $${w.maxPriceCents / 100}`}</Chip>}
                {w.maxDistanceKm !== null && <Chip>Within {Math.round(kmToMiles(w.maxDistanceKm) * 10) / 10} mi</Chip>}
                {!w.active && <Chip tone="warn">Paused</Chip>}
                {w.active && <Chip tone={counts[w.id] ? "good" : "neutral"}>{counts[w.id] ? `${counts[w.id]} match${counts[w.id] === 1 ? "" : "es"}` : "No matches yet"}</Chip>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <Button variant="ghost" onClick={() => { setEditing(w.id); setText(w.rawText); }}>Edit</Button>
                <Button variant="ghost" onClick={() => call(w.id, () => api(`/api/wishlists/${w.id}`, { method: "PATCH", json: { active: !w.active } }), w.active ? "Paused. We won't look for this for now." : "Back on. We're watching again.")}>{w.active ? "Pause" : "Resume"}</Button>
                <Button variant="ghost" onClick={() => call(w.id, () => api(`/api/wishlists/${w.id}`, { method: "DELETE" }), "Wishlist removed.")}>Remove</Button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

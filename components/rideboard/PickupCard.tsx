"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import type { Pickup } from "@/lib/db/types";
import { roleOf, type PickupAction } from "@/lib/pickups/state";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const first = (n: string | null) => (n ? n.trim().split(/\s+/)[0] : "");
const STATUS: Record<Pickup["status"], { label: string; tone: "accent" | "warn" | "good" | "neutral" | "bad" }> = {
  open: { label: "Looking for a driver", tone: "accent" }, offered: { label: "A driver offered", tone: "warn" }, accepted: { label: "Driver confirmed", tone: "good" },
  completed: { label: "Picked up", tone: "good" }, cancelled: { label: "Cancelled", tone: "neutral" },
};

export function PickupCard({ p, userId }: { p: Pickup; userId: string }) {
  const router = useRouter();
  const toast = useToast();
  const role = roleOf(userId, p);
  const [busy, setBusy] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [offering, setOffering] = useState(false);

  async function act(action: PickupAction, msg: string, contactNote?: string) {
    setBusy(action);
    try { await api(`/api/pickups/${p.id}/transition`, { method: "POST", json: { action, contactNote: contactNote || null } }); toast({ message: msg }); setOffering(false); router.refresh(); }
    catch (e) { toast({ message: errMsg(e), tone: "error" }); router.refresh(); } finally { setBusy(null); }
  }
  const st = STATUS[p.status];
  const other = role === "requester" ? first(p.driverName) : first(p.requesterName);
  return (
    <li className="rise flex gap-4 rounded-2xl border border-line bg-surface p-3 sm:p-4" data-testid={`pickup-${p.id}`}>
      <Link href={`/items/${p.listingId}`} className="block w-24 shrink-0 sm:w-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.listingPhotoUrl && <img src={p.listingPhotoUrl} alt={p.listingTitle} className="aspect-[4/3] w-full rounded-xl object-cover" />}
      </Link>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2"><Chip tone={st.tone}>{st.label}</Chip>{role === "requester" && <Chip>Your request</Chip>}{role === "driver" && <Chip>You're driving</Chip>}</div>
        <Link href={`/items/${p.listingId}`} className="block font-semibold hover:underline">{p.listingTitle}</Link>
        <p className="text-sm">{p.fromNeighborhood} <span aria-label="to">→</span> {p.toNeighborhood}</p>
        <p className="text-sm text-muted">{first(p.requesterName)} needs help{p.preferredWindow ? ` · ${p.preferredWindow}` : ""}</p>
        {p.note && <p className="text-sm text-muted">“{p.note}”</p>}
        {p.driverId && p.status !== "open" && p.status !== "cancelled" && <p className="text-sm">Driver: <strong>{first(p.driverName)}</strong></p>}
        {p.status === "accepted" && (
          <p className="rounded-lg bg-good-soft p-2 text-sm text-good">You're connected with {other}.{role === "requester" && p.driverNote ? ` Their note: “${p.driverNote}”` : ""}{role === "driver" && p.note ? ` Their note: “${p.note}”` : ""}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {p.status === "open" && role === "other" && !offering && <Button onClick={() => setOffering(true)}>I can help</Button>}
          {p.status === "open" && role === "other" && offering && (
            <form className="flex w-full flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); act("offer", "Thank you! We've let them know.", contact); }}>
              <TextInput aria-label="A note for them (optional)" placeholder="A note, like when you're free (optional)" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} className="min-w-0 flex-1" />
              <Button type="submit" loading={busy === "offer"}>Send offer</Button><Button type="button" variant="ghost" onClick={() => setOffering(false)}>Cancel</Button>
            </form>
          )}
          {p.status === "offered" && role === "requester" && <><Button onClick={() => act("accept", "Great. You're connected.")} loading={busy === "accept"}>Accept {first(p.driverName)}</Button><Button variant="secondary" onClick={() => act("decline", "No problem. Your request is open again.")}>Not this time</Button></>}
          {p.status === "offered" && role === "driver" && <Button variant="secondary" onClick={() => act("withdraw", "You've stepped back.")}>Withdraw my offer</Button>}
          {p.status === "accepted" && (role === "requester" || role === "driver") && <Button onClick={() => act("complete", "Marked as picked up. Thank you!")} loading={busy === "complete"}>Mark as picked up</Button>}
          {["open", "offered", "accepted"].includes(p.status) && role === "requester" && <Button variant="ghost" onClick={() => act("cancel", "Request cancelled.")}>Cancel request</Button>}
          {p.status === "completed" && userId === p.giverId && p.listingStatus === "available" && <Link href={`/items/${p.listingId}`} className="min-h-11 py-2.5 text-sm font-semibold text-accent underline">Mark your item as given away</Link>}
        </div>
      </div>
    </li>
  );
}

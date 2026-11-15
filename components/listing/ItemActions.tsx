"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { NeighborhoodInput } from "@/components/ui/NeighborhoodInput";
import { useToast } from "@/components/ui/Toast";

type Props = {
  listingId: string; hasSize: boolean; isFurniture: boolean; signedIn: boolean; interested: boolean; requestedMeasure: boolean;
  activePickup: boolean; rooms: { id: string; name: string }[]; defaultTo: string; fromNeighborhood: string;
};

export function ItemActions(p: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [showPickup, setShowPickup] = useState(false);
  const [to, setTo] = useState(p.defaultTo);
  const [win, setWin] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const next = encodeURIComponent(`/items/${p.listingId}`);

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key); setErr(null);
    try { await fn(); toast({ message: success }); router.refresh(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(null); }
  }

  if (!p.signedIn) {
    return <div className="space-y-3"><LinkButton href={`/signin?next=${next}`} className="w-full">Sign in to get this</LinkButton><p className="text-sm text-muted">Signing in takes a few seconds. No password.</p></div>;
  }
  // Never assume a room: the chooser page lets the user pick one.
  const roomHref = `/rooms?add=${p.listingId}`;
  return (
    <div className="space-y-3">
      {p.interested ? <p className="rounded-xl bg-good-soft p-3 font-medium text-good" role="status">You've let them know you're interested.</p>
        : <Button className="w-full" loading={busy === "interest"} onClick={() => run("interest", () => api(`/api/listings/${p.listingId}/interest`, { method: "POST" }), "We've let them know.")}>I'm interested</Button>}

      {p.isFurniture && (
        <div className="space-y-2 rounded-2xl border border-line bg-surface p-3">
          <LinkButton href={roomHref} variant="secondary" className="w-full">{p.rooms.length ? "Choose a room to arrange it in" : "Make a 3D room to arrange it"}</LinkButton>
        </div>
      )}

      {!p.hasSize && (p.requestedMeasure
        ? <p className="text-sm text-muted" role="status">You asked for measurements. We'll tell you when they're added.</p>
        : <Button variant="secondary" className="w-full" loading={busy === "measure"} onClick={() => run("measure", () => api(`/api/listings/${p.listingId}/measurement-request`, { method: "POST" }), "We've asked for the size.")}>Request measurements</Button>)}

      {p.activePickup ? <LinkButton href="/rideboard" variant="secondary" className="w-full">See your pickup request</LinkButton>
        : !showPickup ? <Button variant="secondary" className="w-full" onClick={() => setShowPickup(true)}>Request pickup help</Button>
        : (
          <form className="rise space-y-3 rounded-2xl border border-line bg-surface p-4" onSubmit={(e) => { e.preventDefault(); run("pickup", () => api("/api/pickups", { method: "POST", json: { listingId: p.listingId, fromNeighborhood: p.fromNeighborhood, toNeighborhood: to, preferredWindow: win || null, note: note || null } }).then(() => setShowPickup(false)), "Pickup request posted to RideBoard."); }}>
            <h3 className="font-semibold">Ask a neighbor to help bring it home</h3>
            <p className="text-sm text-muted">Picking up from <strong>{p.fromNeighborhood}</strong></p>
            <Field label="Drop-off neighborhood" htmlFor="pk-to"><NeighborhoodInput id="pk-to" value={to} onChange={(e) => setTo(e.target.value)} required /></Field>
            <Field label="When works for you?" htmlFor="pk-win"><TextInput id="pk-win" list="windows" value={win} onChange={(e) => setWin(e.target.value)} placeholder="e.g. Weekday evening" /><datalist id="windows">{["Weekday evening", "Weekday daytime", "Saturday morning", "Saturday afternoon", "Sunday"].map((w) => <option key={w} value={w} />)}</datalist></Field>
            <Field label="Anything a driver should know? (optional)" htmlFor="pk-note"><TextArea id="pk-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></Field>
            <div className="flex gap-2"><Button type="submit" loading={busy === "pickup"}>Post request</Button><Button type="button" variant="ghost" onClick={() => setShowPickup(false)}>Cancel</Button></div>
          </form>
        )}
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      <p className="text-center text-sm text-muted"><Link href="/rideboard" className="underline">How pickup help works</Link></p>
    </div>
  );
}

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
  rooms: { id: string; name: string }[];
};

export function ItemActions(p: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
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

      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
    </div>
  );
}

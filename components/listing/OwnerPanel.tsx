"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import { parseLength, type Unit } from "@/lib/units";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function OwnerPanel({ id, hasSize, interestCount, openRequests, status }: { id: string; hasSize: boolean; interestCount: number; openRequests: number; status: string }) {
  const router = useRouter();
  const toast = useToast();
  const [unit, setUnit] = useState<Unit>("ft");
  const [w, setW] = useState(""), [d, setD] = useState(""), [h, setH] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function patch(body: unknown, msg: string) {
    setBusy(true); setErr(null);
    try { await api(`/api/listings/${id}`, { method: "PATCH", json: body }); toast({ message: msg }); router.refresh(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }
  function saveSize(e: React.FormEvent) {
    e.preventDefault();
    const [wm, dm, hm] = [parseLength(w, unit), parseLength(d, unit), parseLength(h, unit)];
    if (wm == null || dm == null || hm == null) { setErr(unit === "ft" ? "Please enter all three sizes, like 4 or 3'6\"." : "Please enter all three sizes in meters, like 1.2."); return; }
    patch({ widthM: wm, depthM: dm, heightM: hm }, "Size saved. Thank you!");
  }
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-4" aria-label="Your listing">
      <h2 className="font-semibold">This is your listing</h2>
      <p className="text-sm text-muted">{interestCount} {interestCount === 1 ? "person has" : "people have"} said they're interested.{openRequests > 0 && ` ${openRequests} asked for measurements.`}</p>
      {!hasSize && (
        <form onSubmit={saveSize} className="space-y-3">
          <p className="text-sm font-semibold">Add the size (optional)</p>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Width" htmlFor="o-w"><TextInput id="o-w" value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal" /></Field>
            <Field label="Depth" htmlFor="o-d"><TextInput id="o-d" value={d} onChange={(e) => setD(e.target.value)} inputMode="decimal" /></Field>
            <Field label="Height" htmlFor="o-h"><TextInput id="o-h" value={h} onChange={(e) => setH(e.target.value)} inputMode="decimal" /></Field>
          </div>
          <div className="flex items-center gap-2"><Select aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="!w-32"><option value="ft">feet</option><option value="m">meters</option></Select><Button type="submit" loading={busy}>Save size</Button></div>
        </form>
      )}
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      {status === "available" && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary" onClick={() => patch({ status: "claimed" }, "Marked as given away. Thank you!")}>Mark as given away</Button>
          <Button variant="ghost" onClick={() => patch({ status: "removed" }, "Listing taken down.")}>Take it down</Button>
        </div>
      )}
    </section>
  );
}

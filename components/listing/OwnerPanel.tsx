"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, errMsg } from "@/lib/client";
import type { MeasurementResult } from "@/lib/ai/types";
import { parseLength, formatLength, type Unit } from "@/lib/units";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { ScanSection } from "./ScanSection";
import type { ScanSize } from "./ScanViewer";

export function OwnerPanel({ id, model, size, extras, labelSuggestions, hasSize, interestCount, openRequests, status }: { id: string; model: { url: string; format: "glb" | "usdz" } | null; size: { widthM: number; depthM: number; heightM: number } | null; extras: { label: string; valueM: number }[]; labelSuggestions: string[]; hasSize: boolean; interestCount: number; openRequests: number; status: string }) {
  const router = useRouter();
  const toast = useToast();
  const [unit, setUnit] = useState<Unit>(size ? "m" : "ft");
  const m2 = (m: number) => String(Math.round(m * 100) / 100);
  const [w, setW] = useState(size ? m2(size.widthM) : ""), [d, setD] = useState(size ? m2(size.depthM) : ""), [h, setH] = useState(size ? m2(size.heightM) : "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  type Row = { label: string; value: string };
  const mToText = (m: number) => String(Math.round(m * 100) / 100);
  const [rows, setRows] = useState<Row[]>(() => extras.map((x) => ({ label: x.label, value: mToText(x.valueM) })));
  const [rowsUnit, setRowsUnit] = useState<Unit>(extras.length ? "m" : "ft");
  const [scanSize, setScanSize] = useState<ScanSize | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reading, setReading] = useState(false);
  const [readNote, setReadNote] = useState<string | null>(null);

  /** Pre-fills the fields from a screenshot. Nothing is saved until the owner checks the numbers and presses Save size. */
  async function readScreenshot(file: File) {
    setReading(true); setErr(null); setReadNote(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api<MeasurementResult>("/api/ai/read-measurements", { method: "POST", body: fd });
      if (r.status !== "ok") { setErr(r.reason === "none_found" ? "We couldn't find any printed measurements in that image. You can type them in instead." : "We couldn't read that screenshot. You can type the size in instead."); return; }
      const f = (m: number | null) => (m == null ? "" : String(Math.round(m * 100) / 100));
      setUnit("m"); setW(f(r.widthM)); setD(f(r.depthM)); setH(f(r.heightM));
      if (r.others.length) {
        setRowsUnit("m");
        setRows((prev) => { const have = new Set(prev.map((x) => x.label.toLowerCase())); return [...prev.filter((x) => x.label || x.value), ...r.others.filter((o) => !have.has(o.label.toLowerCase())).map((o) => ({ label: o.label, value: mToText(o.valueM) }))].slice(0, 8); });
      }
      setReadNote("Read from your screenshot, in meters. Please check each number before saving. Any box left empty wasn't shown.");
    } catch (e) { setErr(errMsg(e)); } finally { setReading(false); }
  }

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
  /** A fresh scan fills the size straight away when none is saved yet. Measured by the scan, never guessed; the owner can edit it below. */
  const autoApplied = useRef(false);
  useEffect(() => {
    if (!scanSize || hasSize || autoApplied.current) return;
    const r = (m: number) => Math.round(m * 100) / 100;
    const [wm, dm, hm] = [r(scanSize.widthM), r(scanSize.depthM), r(scanSize.heightM)];
    if (![wm, dm, hm].every((v) => v >= 0.02 && v <= 10)) { setReadNote("The scan's size looked off, so we didn't fill it in. You can type the size in."); return; }
    autoApplied.current = true;
    setUnit("m"); setW(String(wm)); setD(String(dm)); setH(String(hm));
    void patch({ widthM: wm, depthM: dm, heightM: hm }, `Size set from your scan: ${formatLength(wm, "ft")} × ${formatLength(dm, "ft")} × ${formatLength(hm, "ft")}. Edit it below if it looks off.`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanSize, hasSize]);

  async function uploadScan(file: File) {
    setUploading(true); setErr(null); setScanSize(null);
    try { const fd = new FormData(); fd.append("file", file); await api(`/api/listings/${id}/model`, { method: "POST", body: fd }); toast({ message: "3D scan added. Thank you!" }); router.refresh(); }
    catch (e) { setErr(errMsg(e)); } finally { setUploading(false); }
  }
  async function removeScan() {
    setBusy(true); setErr(null); setScanSize(null);
    try { await api(`/api/listings/${id}/model`, { method: "DELETE" }); toast({ message: "3D scan removed." }); router.refresh(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }
  /** Pre-fills width, depth and height from the scan's bounding box. The owner still checks and presses Save size. */
  function useScanSize() {
    if (!scanSize) return;
    const f = (m: number) => String(Math.round(m * 100) / 100);
    setUnit("m"); setW(f(scanSize.widthM)); setD(f(scanSize.depthM)); setH(f(scanSize.heightM));
    setReadNote("Taken from your 3D scan, in meters. Please check each number before saving.");
  }
  function saveExtras(e: React.FormEvent) {
    e.preventDefault();
    const filled = rows.filter((r) => r.label.trim() || r.value.trim());
    const out: { label: string; valueM: number }[] = [];
    for (const r of filled) {
      const m = parseLength(r.value, rowsUnit);
      if (!r.label.trim() || m == null) { setErr("Each extra measurement needs a name and a size, like seat height and 18."); return; }
      out.push({ label: r.label.trim(), valueM: m });
    }
    patch({ extraMeasurements: out }, "Measurements saved. Thank you!");
  }
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-4" aria-label="Your listing">
      <h2 className="font-semibold">This is your listing</h2>
      <p className="text-sm text-muted">{interestCount} {interestCount === 1 ? "person has" : "people have"} said they're interested.{openRequests > 0 && ` ${openRequests} asked for measurements.`}</p>
      {(
        <form onSubmit={saveSize} className="space-y-3">
          <p className="text-sm font-semibold">{hasSize ? "Size" : "Add the size (optional)"}</p>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Width" htmlFor="o-w"><TextInput id="o-w" value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal" /></Field>
            <Field label="Depth" htmlFor="o-d"><TextInput id="o-d" value={d} onChange={(e) => setD(e.target.value)} inputMode="decimal" /></Field>
            <Field label="Height" htmlFor="o-h"><TextInput id="o-h" value={h} onChange={(e) => setH(e.target.value)} inputMode="decimal" /></Field>
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center rounded-xl border border-line px-3 py-2 text-sm font-medium hover:bg-sunken">
              {reading ? "Reading…" : "Read from a Measure or Reality Composer screenshot"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" data-testid="measure-screenshot" disabled={reading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void readScreenshot(f); e.target.value = ""; }} />
            </label>
            {readNote && <p role="status" className="mt-2 text-sm text-muted">{readNote}</p>}
          </div>
          <div className="flex items-center gap-2"><Select aria-label="Unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="!w-32"><option value="ft">feet</option><option value="m">meters</option></Select><Button type="submit" loading={busy}>Save size</Button></div>
        </form>
      )}
      <section className="space-y-3 border-t border-line pt-4" aria-label="3D scan">
        <p className="text-sm font-semibold">3D scan (optional)</p>
        {model ? (
          <>
            <ScanSection url={model.url} format={model.format} title="your item" onSize={setScanSize} />
            <div className="flex flex-wrap gap-2">
              {scanSize && <Button type="button" variant="secondary" onClick={useScanSize}>Use the scan's size</Button>}
              <Button type="button" variant="ghost" onClick={removeScan} loading={busy}>Remove scan</Button>
            </div>
          </>
        ) : <p className="text-sm text-muted">Scan it with Reality Composer on your iPhone (a web page can't use the LiDAR scanner), export it as .usdz, and add it here from the Files app. The size fills in automatically, and others can turn the scan around.</p>}
        <label className="inline-flex cursor-pointer items-center rounded-xl border border-line px-3 py-2 text-sm font-medium hover:bg-sunken">
          {uploading ? "Uploading…" : model ? "Replace the scan (.usdz or .glb)" : "Add a 3D scan (.usdz or .glb)"}
          <input type="file" accept=".usdz,.glb,model/vnd.usdz+zip,model/gltf-binary" className="sr-only" data-testid="scan-file" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadScan(f); e.target.value = ""; }} />
        </label>
      </section>
      <form onSubmit={saveExtras} className="space-y-3 border-t border-line pt-4" aria-label="Other measurements">
        <p className="text-sm font-semibold">Other measurements (optional)</p>
        <p className="text-sm text-muted">Add anything that helps, like seat height or diameter. Name it yourself. These are shown to others but aren't used to check fit.</p>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
            <Field label="Name" htmlFor={`x-l-${i}`}><TextInput id={`x-l-${i}`} list="measure-labels" value={r.label} maxLength={30} placeholder="e.g. Seat height" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></Field>
            <Field label="Size" htmlFor={`x-v-${i}`}><TextInput id={`x-v-${i}`} value={r.value} inputMode="decimal" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} /></Field>
            <Button type="button" variant="ghost" aria-label={`Remove ${r.label || "measurement"}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</Button>
          </div>
        ))}
        <datalist id="measure-labels">{labelSuggestions.map((l) => <option key={l} value={l} />)}</datalist>
        <div className="flex flex-wrap items-center gap-2">
          {rows.length < 8 && <Button type="button" variant="secondary" onClick={() => setRows([...rows, { label: "", value: "" }])}>Add a measurement</Button>}
          <Select aria-label="Unit for other measurements" value={rowsUnit} onChange={(e) => setRowsUnit(e.target.value as Unit)} className="!w-32"><option value="ft">feet</option><option value="m">meters</option></Select>
          <Button type="submit" loading={busy}>Save measurements</Button>
        </div>
      </form>
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

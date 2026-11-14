"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import { parseLength, type Unit } from "@/lib/units";
import { ROOM_LIMITS } from "@/lib/room/defaults";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field, TextInput } from "@/components/ui/Field";

export function RoomForm({ addListingId, defaultName }: { addListingId?: string; defaultName: string }) {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>("ft");
  const [name, setName] = useState(defaultName);
  const [len, setLen] = useState(""), [wid, setWid] = useState(""), [hgt, setHgt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const [l, w, h] = [parseLength(len, unit), parseLength(wid, unit), parseLength(hgt, unit)];
    if (l == null || w == null || h == null) { setErr(unit === "ft" ? "Please enter all three measurements, like 12 or 12'6\"." : "Please enter all three measurements in meters, like 3.7."); return; }
    if (l < ROOM_LIMITS.minLW || l > ROOM_LIMITS.maxLW || w < ROOM_LIMITS.minLW || w > ROOM_LIMITS.maxLW) { setErr("Length and width should each be between 1 m (3.3 ft) and 30 m (98 ft)."); return; }
    if (h < ROOM_LIMITS.minH || h > ROOM_LIMITS.maxH) { setErr("Ceiling height should be between 1.8 m (6 ft) and 6 m (19.7 ft)."); return; }
    setBusy(true);
    try {
      const r = await api<{ room: { id: string } }>("/api/rooms", { method: "POST", json: { name: name.trim() || defaultName, lengthM: l, widthM: w, heightM: h, displayUnit: unit } });
      router.push(`/rooms/${r.room.id}${addListingId ? `?add=${addListingId}` : ""}`);
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-xl">Add a room</h2>
      <p className="text-sm text-muted">Measure with a tape measure or the free Measure app on your iPhone. Just three numbers.</p>
      <div className="flex gap-2" role="group" aria-label="Units"><Chip active={unit === "ft"} onClick={() => setUnit("ft")}>Feet</Chip><Chip active={unit === "m"} onClick={() => setUnit("m")}>Meters</Chip></div>
      <Field label="Room name" htmlFor="rm-name"><TextInput id="rm-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Length" htmlFor="rm-l"><TextInput id="rm-l" value={len} onChange={(e) => setLen(e.target.value)} inputMode="decimal" placeholder={unit === "ft" ? "12 or 12'6\"" : "3.7"} /></Field>
        <Field label="Width" htmlFor="rm-w"><TextInput id="rm-w" value={wid} onChange={(e) => setWid(e.target.value)} inputMode="decimal" placeholder={unit === "ft" ? "10" : "3"} /></Field>
        <Field label="Ceiling height" htmlFor="rm-h"><TextInput id="rm-h" value={hgt} onChange={(e) => setHgt(e.target.value)} inputMode="decimal" placeholder={unit === "ft" ? "8" : "2.4"} /></Field>
      </div>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      <Button type="submit" loading={busy}>Create my room</Button>
    </form>
  );
}

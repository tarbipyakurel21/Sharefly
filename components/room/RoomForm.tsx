"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/client";
import { mToFt, parseLength, type Unit } from "@/lib/units";
import { ROOM_LIMITS } from "@/lib/room/defaults";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field, TextInput } from "@/components/ui/Field";
import { ApartmentPicker, type PickedSpace } from "./ApartmentPicker";
import { TourPanel } from "./TourPanel";
import type { MeasuredRoom } from "@/lib/matterport/dimensions";

type Measured = { state: "loading" } | { state: "done"; rooms: MeasuredRoom[]; reason: string | null };

export function RoomForm({ addListingId, defaultName, realApartments = false }: { addListingId?: string; defaultName: string; realApartments?: boolean }) {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>("ft");
  const [name, setName] = useState(defaultName);
  const [len, setLen] = useState(""), [wid, setWid] = useState(""), [hgt, setHgt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"map" | "dims">("map");
  const [picked, setPicked] = useState<PickedSpace | null>(null);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [measuredId, setMeasuredId] = useState<string | null>(null);
  const f = (m: number) => String(unit === "ft" ? Math.round(mToFt(m) * 10) / 10 : Math.round(m * 100) / 100);

  function pick(s: PickedSpace) {
    setPicked(s); setMeasuredId(null); setErr(null);
    setName(`${s.communityName ?? "Apartment"}${s.floorPlanName ? ` · ${s.floorPlanName}` : ""}`.slice(0, 40));
    if (s.estimate) { setLen(f(s.estimate.lengthM)); setWid(f(s.estimate.widthM)); setHgt(f(s.estimate.heightM)); } else { setLen(""); setWid(""); setHgt(""); }
    document.getElementById("rm-name")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  // Ask the server for Matterport-measured rooms of the picked space. Any failure just leaves the estimate in place.
  useEffect(() => {
    if (!picked) { setMeasured(null); return; }
    let live = true;
    setMeasured({ state: "loading" });
    api<{ rooms: MeasuredRoom[]; reason: string | null }>(`/api/reference-spaces/${encodeURIComponent(picked.id)}/rooms`)
      .then((r) => live && setMeasured({ state: "done", rooms: r.rooms, reason: r.reason }))
      .catch(() => live && setMeasured({ state: "done", rooms: [], reason: "unavailable" }));
    return () => { live = false; };
  }, [picked]);

  // The room list is no longer shown. When a space has no floor-plan estimate, its largest Matterport-measured room supplies the size
  // so the person can still continue; otherwise the estimate stays.
  useEffect(() => {
    if (!picked || picked.estimate || measuredId || measured?.state !== "done" || measured.rooms.length === 0) return;
    const biggest = [...measured.rooms].sort((a, b) => b.widthM * b.depthM - a.widthM * a.depthM)[0];
    chooseMeasured(biggest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured, picked, measuredId]);

  function chooseMeasured(r: MeasuredRoom) {
    setMeasuredId(r.id);
    setLen(f(r.depthM)); setWid(f(r.widthM)); setHgt(f(r.heightM));
    setName(`${picked?.communityName ?? "Apartment"}${r.label ? ` · ${r.label}` : ""}`.slice(0, 40));
    setErr(null);
  }
  const dimsText = (r: MeasuredRoom) => (unit === "ft" ? `${f(r.widthM)} × ${f(r.depthM)} ft, ${f(r.heightM)} ft ceiling` : `${f(r.widthM)} × ${f(r.depthM)} m, ${f(r.heightM)} m ceiling`);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const [l, w, h] = [parseLength(len, unit), parseLength(wid, unit), parseLength(hgt, unit)];
    if (l == null || w == null || h == null) { setErr(unit === "ft" ? "Please enter all three measurements, like 12 or 12'6\"." : "Please enter all three measurements in meters, like 3.7."); return; }
    if (l < ROOM_LIMITS.minLW || l > ROOM_LIMITS.maxLW || w < ROOM_LIMITS.minLW || w > ROOM_LIMITS.maxLW) { setErr("Length and width should each be between 1 m (3.3 ft) and 30 m (98 ft)."); return; }
    if (h < ROOM_LIMITS.minH || h > ROOM_LIMITS.maxH) { setErr("Ceiling height should be between 1.8 m (6 ft) and 6 m (19.7 ft)."); return; }
    setBusy(true);
    try {
      const r = await api<{ room: { id: string } }>("/api/rooms", { method: "POST", json: { name: name.trim() || defaultName, lengthM: l, widthM: w, heightM: h, displayUnit: unit, ...(picked ? { referenceSpaceId: picked.id, ...(picked.selectedUnitNumber ? { unitNumber: picked.selectedUnitNumber } : {}), ...(measuredId ? { measuredRoomId: measuredId } : {}) } : {}) } });
      router.push(`/rooms/${r.room.id}${addListingId ? `?add=${addListingId}` : ""}`);
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  }
  const mapMode = realApartments && source === "map";
  const sizeReady = len !== "" && wid !== "" && hgt !== "";
  return (
    <div className="space-y-6">
      {realApartments && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="How to make your room">
          <Chip active={source === "map"} onClick={() => setSource("map")}>Pick a 3D room on the map</Chip>
          <Chip active={source === "dims"} onClick={() => { setSource("dims"); setPicked(null); }}>Enter dimensions</Chip>
        </div>
      )}
      {mapMode && <ApartmentPicker onPick={pick} pickedId={picked?.id ?? null} />}
      {(!mapMode || picked) && <form id="room-form" onSubmit={submit} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
        {mapMode && picked && <>
          {picked.selectedUnitNumber && <p className="text-sm text-muted">Apartment {picked.selectedUnitNumber} selected. The exact unit scan is used when available; otherwise the floor-plan or community scan is shown.</p>}
          <TourPanel matterport={picked.matterport} title={picked.communityName ?? "this apartment"} stageHref="#room-form" stageLabel="Continue" />
          {measured?.state === "loading" && <p className="text-sm text-muted">Checking for measured rooms…</p>}
          {!sizeReady && measured?.state === "done" && <p data-testid="no-size-note" className="rounded-xl bg-sunken p-3 text-sm text-muted">No size is provided for this space. Pick another apartment, or enter dimensions instead.</p>}
        </>}
        {!mapMode && <>
          <p className="text-sm text-muted">Measure with a tape measure or the free Measure app on your iPhone. Just three numbers.</p>
          <div className="flex gap-2" role="group" aria-label="Units"><Chip active={unit === "ft"} onClick={() => setUnit("ft")}>Feet</Chip><Chip active={unit === "m"} onClick={() => setUnit("m")}>Meters</Chip></div>
          <Field label="Room name" htmlFor="rm-name"><TextInput id="rm-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /></Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Length" htmlFor="rm-l"><TextInput id="rm-l" value={len} onChange={(e) => setLen(e.target.value)} inputMode="decimal" placeholder={unit === "ft" ? "12 or 12'6\"" : "3.7"} /></Field>
            <Field label="Width" htmlFor="rm-w"><TextInput id="rm-w" value={wid} onChange={(e) => setWid(e.target.value)} inputMode="decimal" placeholder={unit === "ft" ? "10" : "3"} /></Field>
            <Field label="Ceiling height" htmlFor="rm-h"><TextInput id="rm-h" value={hgt} onChange={(e) => setHgt(e.target.value)} inputMode="decimal" placeholder={unit === "ft" ? "8" : "2.4"} /></Field>
          </div>
        </>}
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        {(!mapMode || (picked && sizeReady)) && <Button type="submit" loading={busy}>{mapMode ? "Use this 3D room" : "Create my room"}</Button>}
      </form>}
    </div>
  );
}

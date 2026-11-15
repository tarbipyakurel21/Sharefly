"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, errMsg } from "@/lib/client";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";
import { TYPICAL_SIZE } from "@/lib/room/defaults";
import { clampToRoom, fitStatus, overlaps, halfExtents, findFreeSpot } from "@/lib/room/geometry";
import { formatLength, parseLength, type Unit } from "@/lib/units";
import type { Room } from "@/lib/db/types";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/EmptyState";
import { TextInput } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { FitBadge } from "@/components/listing/FitBadge";
import { PlanView } from "./PlanView";
import type { PlacedPiece } from "./types";

const RoomCanvas = dynamic(() => import("./RoomCanvas"), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });

export type ListingMeta = { own?: boolean; interested?: boolean; model?: { url: string; format: "glb" | "usdz" } | null; title: string; status: string; hasSize: boolean; category: Category; widthM: number | null; depthM: number | null; heightM: number | null };
const PALETTE: Category[] = ["bed", "desk", "chair", "sofa", "table", "dresser", "bookshelf", "storage", "lamp", "rug"];
const NUDGE = 0.05;

function pieceFromListing(id: string, m: ListingMeta): PlacedPiece {
  const t = TYPICAL_SIZE[m.category];
  const known = m.widthM != null && m.depthM != null && m.heightM != null;
  return { id: `p-${crypto.randomUUID()}`, listingId: id, label: m.title, category: m.category, x: 0, z: 0, rotationY: 0, widthM: known ? m.widthM! : t.w, depthM: known ? m.depthM! : t.d, heightM: known ? m.heightM! : t.h, dimensionsConfirmed: known };
}

export function RoomPlanner({ room, initial, listings, addListingId }: { room: Room; initial: PlacedPiece[]; listings: Record<string, ListingMeta>; addListingId: string | null }) {
  const toast = useToast();
  const unit: Unit = room.displayUnit;
  const dims = { lengthM: room.lengthM, widthM: room.widthM, heightM: room.heightM };
  const [pieces, setPieces] = useState<PlacedPiece[]>(() => {
    const base = [...initial];
    if (addListingId && listings[addListingId] && !base.some((p) => p.listingId === addListingId)) {
      const np = pieceFromListing(addListingId, listings[addListingId]);
      base.push(findFreeSpot(np, base, dims));
    }
    return base;
  });
  const [selectedId, setSelectedId] = useState<string | null>(() => (addListingId ? null : null));
  const [view, setView] = useState<"3d" | "plan">("3d");
  const [webgl, setWebgl] = useState(true);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty = useRef(addListingId ? initial.every((p) => p.listingId !== addListingId) && !!listings[addListingId ?? ""] : false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(pieces);
  latest.current = pieces;

  useEffect(() => {
    try { const c = document.createElement("canvas"); if (!(c.getContext("webgl2") || c.getContext("webgl"))) setWebgl(false); } catch { setWebgl(false); }
  }, []);
  useEffect(() => { if (addListingId) { const p = pieces.find((x) => x.listingId === addListingId); if (p) setSelectedId(p.id); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(async () => {
    setSave("saving");
    try {
      await api(`/api/rooms/${room.id}/placements`, { method: "PUT", json: { placements: latest.current } });
      setSave("saved");
    } catch (e) { setSave("error"); toast({ message: errMsg(e), tone: "error" }); }
  }, [room.id, toast]);

  const schedule = useCallback(() => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { dirty.current = false; persist(); }, 800);
  }, [persist]);
  useEffect(() => { if (dirty.current) schedule(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const update = useCallback((id: string, patch: Partial<PlacedPiece>) => {
    setPieces((ps) => ps.map((p) => (p.id === id ? clampToRoom({ ...p, ...patch }, dims) : p)));
    schedule();
  }, [schedule]); // eslint-disable-line react-hooks/exhaustive-deps
  const onMove = useCallback((id: string, x: number, z: number) => update(id, { x, z }), [update]);

  const selected = pieces.find((p) => p.id === selectedId) ?? null;
  const colliding = useMemo(() => {
    const names = new Map<string, string[]>();
    for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) {
      if (pieces[i].category === "rug" || pieces[j].category === "rug") continue;
      if (overlaps(pieces[i], pieces[j])) {
        names.set(pieces[i].id, [...(names.get(pieces[i].id) ?? []), pieces[j].label]);
        names.set(pieces[j].id, [...(names.get(pieces[j].id) ?? []), pieces[i].label]);
      }
    }
    return names;
  }, [pieces]);
  const collidingIds = useMemo(() => new Set(colliding.keys()), [colliding]);

  function add(cat: Category) {
    const t = TYPICAL_SIZE[cat];
    const p = findFreeSpot({ id: `p-${crypto.randomUUID()}`, listingId: null, label: `My ${CATEGORY_LABEL[cat].toLowerCase()}`, category: cat, x: 0, z: 0, rotationY: 0, widthM: t.w, depthM: t.d, heightM: t.h, dimensionsConfirmed: false }, pieces, dims);
    setPieces((ps) => [...ps, p]); setSelectedId(p.id); schedule();
  }
  function remove(id: string) {
    const idx = pieces.findIndex((p) => p.id === id);
    const gone = pieces[idx];
    if (!gone) return;
    setPieces((ps) => ps.filter((p) => p.id !== id)); setSelectedId(null); schedule();
    toast({ message: `Removed ${gone.label}.`, action: { label: "Undo", onClick: () => { setPieces((ps) => { const c = [...ps]; c.splice(Math.min(idx, c.length), 0, gone); return c; }); setSelectedId(gone.id); schedule(); } } });
  }
  const rotate = (deg: number) => selected && update(selected.id, { rotationY: selected.rotationY + (deg * Math.PI) / 180 });
  const nudge = (dx: number, dz: number) => selected && update(selected.id, { x: selected.x + dx, z: selected.z + dz });

  function onKey(e: React.KeyboardEvent) {
    if (!selected || (e.target as HTMLElement).tagName === "INPUT") return;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); rotate(90); }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(selected.id); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-NUDGE, 0); }
    else if (e.key === "ArrowRight") { e.preventDefault(); nudge(NUDGE, 0); }
    else if (e.key === "ArrowUp") { e.preventDefault(); nudge(0, -NUDGE); }
    else if (e.key === "ArrowDown") { e.preventDefault(); nudge(0, NUDGE); }
  }

  function setSize(key: "widthM" | "depthM" | "heightM", text: string) {
    if (!selected) return;
    const m = parseLength(text, unit);
    if (m == null || m > 10) { toast({ message: unit === "ft" ? "Please enter a size like 4 or 3'6\"." : "Please enter a size in meters, like 1.2.", tone: "error" }); return; }
    update(selected.id, { [key]: m, ...(selected.listingId ? {} : { dimensionsConfirmed: true }) });
  }

  const warnings = (p: PlacedPiece) => {
    const w: string[] = [];
    const o = colliding.get(p.id);
    if (o) w.push(`Overlaps ${o.length === 1 ? (/^my /i.test(o[0]) ? o[0].replace(/^my /i, "your ").toLowerCase() : `the ${o[0].toLowerCase()}`) : `${o.length} other pieces`}.`);
    if (p.heightM > room.heightM) w.push("This piece is taller than your ceiling.");
    else if (fitStatus({ widthM: p.widthM, depthM: p.depthM, heightM: p.heightM }, dims) === "wont_fit") w.push("This piece is too big for your floor, even turned.");
    else { const { hx, hz } = halfExtents(p); if (hx * 2 > room.widthM + 1e-6 || hz * 2 > room.lengthM + 1e-6) w.push("This piece doesn't fit in this direction. Try turning it."); }
    return w;
  };
  const scans = useMemo(() => Object.fromEntries(Object.entries(listings).flatMap(([k, v]) => (v.model ? [[k, v.model]] : []))), [listings]);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [asking, setAsking] = useState(false);
  async function requestItem(listingId: string) {
    setAsking(true);
    try { await api(`/api/listings/${listingId}/interest`, { method: "POST" }); setAsked((s) => new Set(s).add(listingId)); toast({ message: "We've let them know you'd like it." }); }
    catch (e) { toast({ message: errMsg(e), tone: "error" }); } finally { setAsking(false); }
  }
  const meta = selected?.listingId ? listings[selected.listingId] : undefined;
  const pieceFit = (p: PlacedPiece) => (p.dimensionsConfirmed ? fitStatus({ widthM: p.widthM, depthM: p.depthM, heightM: p.heightM }, dims) : "cant_confirm");
  const show3d = view === "3d" && webgl;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]" onKeyDown={onKey}>
      <div className="space-y-2">
        <div id="room-view" tabIndex={0} aria-label="Room view. Select a piece, then use R to rotate, arrow keys to move, Delete to remove." className="relative h-[55vh] min-h-[340px] overflow-hidden rounded-3xl border border-line bg-sunken lg:h-[68vh]" data-testid="room-view">
          {show3d ? <RoomCanvas scans={scans} room={dims} unit={unit} pieces={pieces} selectedId={selectedId} collidingIds={collidingIds} onSelect={setSelectedId} onMove={onMove} />
            : <PlanView room={dims} pieces={pieces} selectedId={selectedId} collidingIds={collidingIds} onSelect={setSelectedId} onMove={onMove} />}
        </div>
        {!webgl && <p className="text-sm text-muted" role="status">3D isn't available on this device, so here's a top-down plan instead. Everything works the same.</p>}
        <div className="flex flex-wrap items-center gap-2">
          {webgl && <><Chip active={view === "3d"} onClick={() => setView("3d")}>3D view</Chip><Chip active={view === "plan"} onClick={() => setView("plan")}>Top-down plan</Chip></>}
          <span className="ml-auto text-sm text-muted" role="status" data-testid="save-state">{save === "saving" ? "Saving…" : save === "saved" ? "Saved" : save === "error" ? "Couldn't save" : "Changes save automatically"}</span>
          {save === "error" && <Button variant="secondary" onClick={persist}>Try again</Button>}
        </div>
      </div>

      <aside className="space-y-5">
        <div>
          <h2 className="font-display text-xl">{room.name}</h2>
          <p className="text-sm text-muted">{formatLength(room.lengthM, unit)} long · {formatLength(room.widthM, unit)} wide · {formatLength(room.heightM, unit)} tall</p>
        </div>

        {selected ? (
          <section className="space-y-3 rounded-2xl border border-line bg-surface p-4" aria-label="Selected piece">
            <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{selected.label}</h3>
              {selected.listingId && <FitBadge status={pieceFit(selected)} />}</div>
            <span className="sr-only" data-testid="piece-pos">{selected.x.toFixed(2)},{selected.z.toFixed(2)}</span>
            {!selected.dimensionsConfirmed && <p className="rounded-lg bg-warn-soft p-2 text-sm text-warn" data-testid="unconfirmed-note">Typical {CATEGORY_LABEL[selected.category].toLowerCase()} size. Actual size not confirmed.</p>}
            {meta && !meta.hasSize && <Button variant="secondary" onClick={async () => { try { await api(`/api/listings/${selected.listingId}/measurement-request`, { method: "POST" }); toast({ message: "We've asked for the size." }); } catch (e) { toast({ message: errMsg(e), tone: "error" }); } }}>Request measurements</Button>}
            {meta && meta.status !== "available" && <p className="text-sm text-warn">No longer available.</p>}
            {selected.listingId && meta && !meta.own && meta.status === "available" && pieceFit(selected) === "fits" && (
              meta.interested || asked.has(selected.listingId)
                ? <p className="rounded-xl bg-good-soft p-3 text-sm font-medium text-good" role="status" data-testid="requested">You've asked for this. The owner knows.</p>
                : <Button className="w-full" loading={asking} onClick={() => requestItem(selected.listingId!)} data-testid="request-item">It fits. Request this item</Button>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => rotate(90)} aria-label="Rotate 90 degrees"><Icon name="rotate" size={18} /> 90°</Button>
              <Button variant="secondary" onClick={() => rotate(15)} aria-label="Rotate 15 degrees"><Icon name="rotate" size={18} /> 15°</Button>
              <Button variant="danger" onClick={() => remove(selected.id)}><Icon name="trash" size={18} /> Remove</Button>
            </div>
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Nudge piece">
              <span /><Button variant="ghost" aria-label="Move away" onClick={() => nudge(0, -NUDGE)}>↑</Button><span />
              <Button variant="ghost" aria-label="Move left" onClick={() => nudge(-NUDGE, 0)}>←</Button><Button variant="ghost" aria-label="Move toward you" onClick={() => nudge(0, NUDGE)}>↓</Button><Button variant="ghost" aria-label="Move right" onClick={() => nudge(NUDGE, 0)}>→</Button>
            </div>
            {(!selected.listingId || !selected.dimensionsConfirmed) && (
              <div className="grid grid-cols-3 gap-2">
                {(["widthM", "depthM", "heightM"] as const).map((k) => (
                  <label key={k} className="text-xs font-semibold text-muted">{k === "widthM" ? "Width" : k === "depthM" ? "Depth" : "Height"}
                    <TextInput key={`${selected.id}-${k}-${selected[k]}`} defaultValue={formatLength(selected[k], unit)} onBlur={(e) => e.target.value !== formatLength(selected[k], unit) && setSize(k, e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className="mt-1 !min-h-10 !px-2 text-sm" />
                  </label>))}
              </div>
            )}
            {warnings(selected).map((w) => <p key={w} role="alert" className="text-sm text-bad">{w}</p>)}
          </section>
        ) : <p className="rounded-2xl bg-sunken p-4 text-sm text-muted">Tap a piece to move, turn, or remove it. Drag to move it around the room.</p>}

        <section aria-label="Add a piece">
          <h3 className="mb-2 text-sm font-semibold">Add something of yours</h3>
          <div className="flex flex-wrap gap-2">{PALETTE.map((c) => <Chip key={c} onClick={() => add(c)}>+ {CATEGORY_LABEL[c]}</Chip>)}</div>
        </section>

        <section aria-label="Pieces in this room">
          <h3 className="mb-2 text-sm font-semibold">In this room ({pieces.length})</h3>
          {pieces.length === 0 ? <p className="text-sm text-muted">Nothing here yet. Add a piece above, or preview an item from the browse page.</p> : (
            <ul className="space-y-1.5" data-testid="piece-list">
              {pieces.map((p) => (
                <li key={p.id} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm ${p.id === selectedId ? "bg-accent-soft" : "hover:bg-sunken"}`}>
                  <button type="button" onClick={() => setSelectedId(p.id)} aria-pressed={p.id === selectedId} className="min-w-0 flex-1 text-left">
                    <span className="block truncate">{p.label}</span><span className="text-xs text-muted">{p.dimensionsConfirmed ? "Size confirmed" : "Typical size"}{collidingIds.has(p.id) ? " · Overlaps" : ""}</span>
                  </button>
                  <button type="button" aria-label={`Remove ${p.label}`} onClick={() => remove(p.id)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-bad hover:bg-bad/10">Remove</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

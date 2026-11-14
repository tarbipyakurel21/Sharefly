"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import type { Driver } from "@/lib/db/types";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field, TextInput } from "@/components/ui/Field";
import { NeighborhoodInput } from "@/components/ui/NeighborhoodInput";
import { useToast } from "@/components/ui/Toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DriverForm({ driver, defaultNeighborhood }: { driver: Driver | null; defaultNeighborhood: string }) {
  const router = useRouter();
  const toast = useToast();
  const [nb, setNb] = useState(driver?.neighborhood ?? defaultNeighborhood);
  const [days, setDays] = useState<string[]>(driver?.days ?? []);
  const [vehicle, setVehicle] = useState(driver?.vehicleNote ?? "");
  const [active, setActive] = useState(driver?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api("/api/drivers/me", { method: "PUT", json: { neighborhood: nb, days, vehicleNote: vehicle || null, active } }); toast({ message: "Saved. We'll tell you about pickups near you." }); router.refresh(); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-line bg-surface p-4">
      <div><h2 className="font-semibold">Got a car? Offer to help.</h2><p className="text-sm text-muted">Tell us roughly where and when. We'll let you know about pickups nearby. No obligation.</p></div>
      <Field label="Neighborhood you drive in" htmlFor="dr-nb"><NeighborhoodInput id="dr-nb" value={nb} onChange={(e) => setNb(e.target.value)} required /></Field>
      <div><p className="mb-2 text-sm font-semibold">Days you're usually free</p><div className="flex flex-wrap gap-2">{DAYS.map((d) => <Chip key={d} active={days.includes(d)} onClick={() => setDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]))}>{d}</Chip>)}</div></div>
      <Field label="Your vehicle (optional)" htmlFor="dr-v"><TextInput id="dr-v" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. Hatchback, pickup truck" maxLength={80} /></Field>
      <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" /> I'm available right now</label>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      <Button type="submit" loading={busy}>Save</Button>
    </form>
  );
}

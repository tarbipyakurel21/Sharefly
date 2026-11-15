"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import type { MatchRow } from "@/lib/db/types";
import { Chip } from "@/components/ui/Chip";

export function MatchCard({ m }: { m: MatchRow }) {
  const router = useRouter();
  const l = m.listing;
  const available = l.status === "available";
  async function dismiss() {
    await api(`/api/matches/${m.id}`, { method: "PATCH", json: { status: "dismissed" } }).catch(() => {});
    router.refresh();
  }
  return (
    <li className={`rise flex gap-4 rounded-2xl border border-line bg-surface p-3 sm:p-4 ${available ? "" : "opacity-75"}`}>
      <Link href={`/items/${l.id}`} className="block w-28 shrink-0 sm:w-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {l.photoUrl && <img src={l.photoUrl} alt={l.title} className="aspect-[4/3] w-full rounded-xl object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {m.status === "new" && available && <Chip tone="accent">New</Chip>}
          {!available && <Chip tone="warn">No longer available</Chip>}
        </div>
        <Link href={`/items/${l.id}`} className="mt-1 block font-semibold leading-snug hover:underline">{l.title}</Link>
        <p className="text-sm text-muted">Free · {l.neighborhood ?? "Neighborhood not shared"}</p>
        <p className="mt-1 text-sm text-muted">For your wishlist: “{m.wishlistText}”</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">{m.reasons.map((r) => <li key={r}><Chip tone="good">{r}</Chip></li>)}</ul>
        <div className="mt-2"><button onClick={dismiss} className="min-h-11 text-sm text-muted underline">Not for me</button></div>
      </div>
    </li>
  );
}

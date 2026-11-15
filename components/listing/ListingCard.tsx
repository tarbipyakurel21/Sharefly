import Link from "next/link";
import type { Listing } from "@/lib/db/types";
import type { FitStatus } from "@/lib/room/geometry";
import { FitBadge } from "./FitBadge";

export function ListingCard({ l, fit }: { l: Listing; fit?: FitStatus | null }) {
  return (
    <Link href={`/items/${l.id}`} className="group block rise">
      <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-sunken">
        {l.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photoUrl} alt={l.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : <div className="flex h-full items-center justify-center text-muted">No photo</div>}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{l.title}</h3>
        <span className="shrink-0 text-sm font-semibold text-good">Free</span>
      </div>
      <p className="text-sm text-muted">{l.neighborhood ?? "Neighborhood not shared"}</p>
      {fit && <div className="mt-2"><FitBadge status={fit} /></div>}
    </Link>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listRooms } from "@/lib/db/queries";
import { formatLength } from "@/lib/units";
import { SignInCard } from "@/components/layout/SignInForm";
import { RoomForm } from "@/components/room/RoomForm";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Your rooms" };
export const dynamic = "force-dynamic";

export default async function RoomsPage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const user = await getSessionUser();
  const { add } = await searchParams;
  if (!user) return <SignInCard title="Sign in to plan your room" body="Save your room and try furniture in it before you pick it up." />;
  const rooms = listRooms(user.id);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Your rooms</h1>
        <p className="mt-1 text-muted">Add a room's measurements and see exactly how a piece of furniture would sit in it.</p>
      </div>
      {rooms.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rooms.map((r) => (
            <li key={r.id}><Link href={`/rooms/${r.id}${add ? `?add=${add}` : ""}`} className="block rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-soft)]">
              <h2 className="font-semibold">{r.name}</h2>
              <p className="text-sm text-muted">{formatLength(r.lengthM, r.displayUnit)} × {formatLength(r.widthM, r.displayUnit)} · {formatLength(r.heightM, r.displayUnit)} ceiling</p>
            </Link></li>
          ))}
        </ul>
      ) : <EmptyState title="No rooms yet" body="Add one below. It only takes length, width and height." />}
      <RoomForm addListingId={add} defaultName={rooms.length ? `Room ${rooms.length + 1}` : "Bedroom"} />
    </div>
  );
}

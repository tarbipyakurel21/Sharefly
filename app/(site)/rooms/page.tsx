import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listRooms } from "@/lib/db/queries";
import { getReferenceSpaceProvider } from "@/lib/reference-spaces/provider";
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
  const rooms = await listRooms(user.id);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Your rooms</h1>
        <p className="mt-1 text-muted">{add ? "Choose a room to arrange this item in." : "Select a room to see exactly how a piece of furniture would sit in it."}</p>
      </div>
      {rooms.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rooms.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-[var(--shadow-soft)]">
              <h2 className="font-semibold">{r.name}</h2>
              <p className="text-sm text-muted">{formatLength(r.lengthM, r.displayUnit)} × {formatLength(r.widthM, r.displayUnit)} · {formatLength(r.heightM, r.displayUnit)} ceiling</p>
              <Link href={`/rooms/${r.id}${add ? `?add=${add}` : ""}`} className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                {add ? "Select this room" : "Select room"}
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No rooms yet" body="Add one below. It only takes length, width and height." />}
      <RoomForm realApartments={await getReferenceSpaceProvider().isAvailable()} addListingId={add} defaultName={rooms.length ? `Room ${rooms.length + 1}` : "Bedroom"} />
    </div>
  );
}

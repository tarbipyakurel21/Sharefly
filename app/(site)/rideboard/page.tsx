import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { getDriver, listMyPickups, listOpenPickups } from "@/lib/db/queries";
import { SignInCard } from "@/components/layout/SignInForm";
import { PickupCard } from "@/components/rideboard/PickupCard";
import { DriverForm } from "@/components/rideboard/DriverForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "RideBoard" };
export const dynamic = "force-dynamic";

export default async function RideBoard() {
  const user = await getSessionUser();
  if (!user) return <SignInCard title="Sign in to use RideBoard" body="Ask neighbors for a hand carrying something home, or offer a ride." />;
  const mine = await listMyPickups(user.id);
  const mineIds = new Set(mine.map((p) => p.id));
  const board = (await listOpenPickups()).filter((p) => !mineIds.has(p.id));
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-3xl">RideBoard</h1>
        <p className="mt-1 text-muted">Neighbors helping neighbors get things home. Ask for a hand from any item page. No payments, no tracking, just a friendly way to coordinate.</p>
      </div>
      <section aria-labelledby="mine" className="space-y-3">
        <h2 id="mine" className="font-display text-xl">My pickups</h2>
        {mine.length ? <ul className="space-y-3">{mine.map((p) => <PickupCard key={p.id} p={p} userId={user.id} />)}</ul> : (
          <EmptyState title="Nothing arranged yet" body="Found something you want to pick up? Open the item and choose “Request pickup help”."><LinkButton href="/browse">Browse items</LinkButton></EmptyState>
        )}
      </section>
      <section aria-labelledby="board" className="space-y-3">
        <h2 id="board" className="font-display text-xl">Pickups that need a driver</h2>
        {board.length ? <ul className="space-y-3" data-testid="board">{board.map((p) => <PickupCard key={p.id} p={p} userId={user.id} />)}</ul> : <EmptyState title="All caught up" body="No one is waiting for a ride right now." />}
      </section>
      <section aria-label="Driver availability"><DriverForm driver={await getDriver(user.id)} defaultNeighborhood={user.neighborhood ?? ""} /></section>
    </div>
  );
}

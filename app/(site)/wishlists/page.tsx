import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { listWishlists } from "@/lib/db/queries";
import { getDb } from "@/lib/db/client";
import { SignInCard } from "@/components/layout/SignInForm";
import { WishlistComposer } from "@/components/wishlist/WishlistComposer";
import { WishlistList } from "@/components/wishlist/WishlistList";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Wishlists" };
export const dynamic = "force-dynamic";

export default async function WishlistsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getSessionUser();
  const { q } = await searchParams;
  if (!user) return <SignInCard title="Sign in to save a wishlist" body="Tell us what you're looking for and we'll let you know when it turns up." />;
  const items = listWishlists(user.id);
  const rows = getDb().prepare("SELECT wishlist_id, COUNT(*) c FROM matches m JOIN listings l ON l.id=m.listing_id WHERE l.status='available' AND m.status!='dismissed' GROUP BY wishlist_id").all() as { wishlist_id: string; c: number }[];
  const counts = Object.fromEntries(rows.map((r) => [r.wishlist_id, r.c]));
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl">Your wishlists</h1>
        <p className="mt-1 text-muted">Tell us what you need once. We'll keep an eye out so you don't have to.</p>
      </div>
      <WishlistComposer initialText={q ?? ""} defaultNeighborhood={user.neighborhood ?? ""} />
      {items.length ? <WishlistList items={items} counts={counts} /> : <EmptyState title="No wishlists yet" body="Describe something you're looking for above, like “a desk under $30”." />}
    </div>
  );
}

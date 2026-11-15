import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { listWishlists, matchCountsByWishlist } from "@/lib/db/queries";
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
  const items = await listWishlists(user.id);
  const counts = await matchCountsByWishlist(items.map((w) => w.id));
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-muted">Tell us what you need once. We'll keep an eye out so you don't have to.</p>
      </div>
      <WishlistComposer initialText={q ?? ""} defaultNeighborhood={user.neighborhood ?? ""} />
      {items.length ? <WishlistList items={items} counts={counts} /> : <EmptyState title="No wishlists yet" body="Describe something you're looking for above, like “a desk under $30”." />}
    </div>
  );
}

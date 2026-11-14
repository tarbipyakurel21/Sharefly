import type { Metadata } from "next";
import { listListings } from "@/lib/db/queries";
import { getSessionUser } from "@/lib/auth";
import { listRooms } from "@/lib/db/queries";
import { fitForRooms } from "@/lib/fit";
import { ListingCard } from "@/components/listing/ListingCard";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton, Button } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/categories";
import { NEIGHBORHOODS } from "@/lib/geo/neighborhoods";

export const metadata: Metadata = { title: "Browse" };
export const dynamic = "force-dynamic";

type SP = { q?: string; category?: string; neighborhood?: string; free?: string };

export default async function Browse({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const rooms = user ? listRooms(user.id) : [];
  const category = CATEGORIES.includes(sp.category as never) ? sp.category : undefined;
  const items = listListings({ q: sp.q, category, neighborhood: sp.neighborhood || undefined, freeOnly: sp.free === "1" });
  const qs = (o: Partial<SP>) => {
    const p = new URLSearchParams();
    const m = { ...sp, ...o };
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, v);
    const s = p.toString();
    return `/browse${s ? `?${s}` : ""}`;
  };
  const wishText = [sp.q, category && !sp.q?.includes(category) ? category : ""].filter(Boolean).join(" ");
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Find something you need</h1>
      <form action="/browse" className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]" role="search">
        {category && <input type="hidden" name="category" value={category} />}
        <TextInput name="q" defaultValue={sp.q ?? ""} placeholder="Search for a desk, a lamp, a bookshelf…" aria-label="Search items" />
        <Select name="neighborhood" defaultValue={sp.neighborhood ?? ""} aria-label="Neighborhood">
          <option value="">Any neighborhood</option>
          {NEIGHBORHOODS.map((n) => <option key={n.name}>{n.name}</option>)}
        </Select>
        <label className="flex min-h-11 items-center gap-2 text-[15px]"><input type="checkbox" name="free" value="1" defaultChecked={sp.free === "1"} className="h-5 w-5 accent-[var(--color-accent)]" /> Free only</label>
        <Button type="submit">Search</Button>
      </form>
      <div className="flex flex-wrap gap-2" aria-label="Categories">
        <Chip href={qs({ category: undefined })} active={!category}>All</Chip>
        {CATEGORIES.filter((c) => c !== "other").map((c) => <Chip key={c} href={qs({ category: c })} active={category === c}>{CATEGORY_LABEL[c]}</Chip>)}
      </div>
      {items.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {items.map((l) => <ListingCard key={l.id} l={l} fit={fitForRooms(l, rooms)} />)}
        </div>
      ) : (
        <EmptyState title="Nothing matches yet" body="Save this as a wishlist and we'll let you know when something turns up.">
          <LinkButton href={`/wishlists${wishText ? `?q=${encodeURIComponent(wishText)}` : ""}`}>Save as a wishlist</LinkButton>
        </EmptyState>
      )}
    </div>
  );
}

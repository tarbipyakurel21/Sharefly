import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { matchesForUser } from "@/lib/db/queries";
import { SignInCard } from "@/components/layout/SignInForm";
import { MatchCard } from "@/components/match/MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Your matches" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await getSessionUser();
  if (!user) return <SignInCard title="Sign in to see your matches" body="We'll show items that fit what you're looking for." />;
  const matches = await matchesForUser(user.id);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mt-1 text-muted">Based on your wishlists. New ones show up here the moment they're listed.</p>
      </div>
      {matches.length ? <ul className="space-y-3" data-testid="match-list">{matches.map((m) => <MatchCard key={m.id} m={m} />)}</ul> : (
        <EmptyState title="Nothing yet" body="When someone lists something that fits your wishlist, you'll see it here and get a notification.">
          <LinkButton href="/wishlists">Add a wishlist</LinkButton><LinkButton href="/browse" variant="secondary">Browse</LinkButton>
        </EmptyState>
      )}
    </div>
  );
}

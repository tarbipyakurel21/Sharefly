import Link from "next/link";
import type { User } from "@/lib/db/types";
import { LinkButton } from "@/components/ui/Button";
import { NotificationBell } from "./NotificationBell";
import { AccountMenu } from "./AccountMenu";
import { isDemoMode } from "@/lib/env";
import { listUsers } from "@/lib/db/queries";

const NAV = [
  { href: "/browse", label: "Browse" },
  { href: "/wishlists", label: "Wishlists" },
  { href: "/matches", label: "Matches" },
  { href: "/rooms", label: "Rooms" },
  { href: "/rideboard", label: "RideBoard" },
];

export async function Header({ user }: { user: User | null }) {
  const demo = isDemoMode();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">ShareFly</Link>
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-[15px] font-medium text-muted transition-colors hover:bg-sunken hover:text-ink">{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user && <NotificationBell />}
          <span className="hidden sm:block"><LinkButton href="/give">Give something away</LinkButton></span>
          <AccountMenu user={user} demo={demo} people={demo ? (await listUsers()).filter((p) => ["u-jordan", "u-maya", "u-sam"].includes(p.id)) : []} />
        </div>
      </div>
    </header>
  );
}

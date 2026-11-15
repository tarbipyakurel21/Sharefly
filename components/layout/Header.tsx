import Link from "next/link";
import Image from "next/image";
import type { User } from "@/lib/db/types";
import { NotificationBell } from "./NotificationBell";
import { AccountMenu } from "./AccountMenu";
import { isDemoMode } from "@/lib/env";
import { listUsers } from "@/lib/db/queries";

export async function Header({ user }: { user: User | null }) {
  const demo = isDemoMode();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight" aria-label="ShareFly home">
          <Image src="/brand/helping-hands.svg" alt="" width={34} height={34} className="h-8 w-8 rounded-lg object-cover" priority />
          <span>ShareFly</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {user && <NotificationBell />}
          <AccountMenu user={user} demo={demo} people={demo ? (await listUsers()).filter((p) => ["u-jordan", "u-maya", "u-sam"].includes(p.id)) : []} />
        </div>
      </div>
    </header>
  );
}

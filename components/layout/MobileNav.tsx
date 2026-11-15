"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const ITEMS = [
  { href: "/browse", label: "Browse", icon: "search" },
  { href: "/wishlists", label: "Wishlists", icon: "heart" },
  { href: "/give", label: "Give", icon: "plus", primary: true },
  { href: "/rooms", label: "Rooms", icon: "room" },
  { href: "/matches", label: "Matches", icon: "bell" },
  { href: "/rideboard", label: "Rides", icon: "truck" },
];

export function MobileNav({ matches }: { matches: number }) {
  const path = usePathname();
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <nav aria-label="Main">
        <ul className="mx-auto grid max-w-2xl grid-cols-6 items-end px-2 py-1.5">
          {ITEMS.map((i) => {
            const active = path === i.href || path.startsWith(i.href + "/");
            return (
              <li key={i.href} className="flex justify-center">
                {i.primary ? (
                  <Link href={i.href} aria-label="Give something away" className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[var(--shadow-soft)] active:scale-95"><Icon name="plus" size={26} /></Link>
                ) : (
                  <Link href={i.href} aria-current={active ? "page" : undefined} className={`relative flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium ${active ? "text-accent" : "text-muted"}`}>
                    <Icon name={i.icon} size={22} />
                    {i.label}
                    {i.href === "/matches" && matches > 0 && <span className="absolute right-2 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{matches}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
}

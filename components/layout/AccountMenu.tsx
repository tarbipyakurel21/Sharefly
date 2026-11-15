"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { User } from "@/lib/db/types";
import { api } from "@/lib/client";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Field";

export function AccountMenu({ user, demo, people }: { user: User | null; demo: boolean; people: User[] }) {
  const router = useRouter();
  const ref = useRef<HTMLDetailsElement>(null);
  async function switchTo(userId: string) {
    await api("/api/session", { method: "POST", json: { userId } });
    ref.current?.removeAttribute("open");
    router.refresh();
  }
  async function signOut() {
    await api("/api/session", { method: "DELETE" });
    ref.current?.removeAttribute("open");
    router.push("/");
    router.refresh();
  }
  if (!user && !demo) return <Link href="/signin" className="min-h-11 rounded-xl px-3 py-2.5 text-[15px] font-semibold hover:bg-sunken">Sign in</Link>;
  return (
    <details ref={ref} className="relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 hover:bg-sunken [&::-webkit-details-marker]:hidden" aria-label="Account menu">
        <Icon name="user" />
        <span className="hidden max-w-28 truncate text-[15px] font-medium sm:inline">{user ? user.name.split(" ")[0] : "Sign in"}</span>
      </summary>
      <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-soft)]">
        {user ? <p className="px-2 pb-2 text-sm text-muted">Signed in as <span className="font-semibold text-ink">{user.name}</span></p> : <Link href="/signin" className="block px-2 py-2 font-semibold">Sign in</Link>}
        <Link href="/rooms" className="block rounded-lg px-2 py-2.5 hover:bg-sunken md:hidden">My rooms</Link>
        {demo && (
          <div className="mt-2 border-t border-line px-2 pt-3">
            <label htmlFor="demo-person" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Demo: switch person</label>
            <Select id="demo-person" value={user?.id ?? ""} onChange={(e) => e.target.value && switchTo(e.target.value)}>
              {!user && <option value="">Choose a person…</option>}
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
        )}
        {user && <button onClick={signOut} className="mt-2 w-full rounded-lg px-2 py-2.5 text-left hover:bg-sunken">Sign out</button>}
      </div>
    </details>
  );
}

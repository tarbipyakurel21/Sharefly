"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { Notification } from "@/lib/db/types";
import { Icon } from "@/components/ui/Icon";

export function NotificationBell() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDetailsElement>(null);

  const load = useCallback(async () => {
    try { const d = await api<{ unread: number; notifications: Notification[] }>("/api/notifications"); setUnread(d.unread); setItems(d.notifications); } catch { /* keep the last known state */ }
  }, []);

  useEffect(() => { load(); }, [load, pathname]);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 25_000);
    return () => clearInterval(t);
  }, [load]);

  async function onToggle() {
    if (ref.current?.open) {
      await load();
      if (unread > 0) { await api("/api/notifications", { method: "POST", json: {} }).catch(() => {}); setUnread(0); }
    }
  }
  async function remove(id?: string) {
    const before = items;
    setItems(id ? items.filter((n) => n.id !== id) : []);
    if (!id) setUnread(0);
    try { const d = await api<{ unread: number }>(`/api/notifications${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method: "DELETE" }); setUnread(d.unread); }
    catch { setItems(before); } // couldn't delete: put them back
  }
  return (
    <details ref={ref} onToggle={onToggle} className="relative">
      <summary className="relative flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-xl hover:bg-sunken [&::-webkit-details-marker]:hidden" aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}>
        <Icon name="bell" />
        {unread > 0 && <span data-testid="unread-count" className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">{unread}</span>}
      </summary>
      <div className="absolute right-0 mt-2 max-h-96 w-80 overflow-auto rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-soft)]">
        {items.length === 0 ? <p className="p-4 text-sm text-muted">Nothing yet. We'll tell you when something turns up.</p> : (
          <>
            <div className="flex justify-end px-2 pb-1"><button type="button" onClick={() => remove()} className="rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-sunken hover:text-ink">Clear all</button></div>
            {items.map((n) => (
              <div key={n.id} className={`group flex items-start gap-1 rounded-xl hover:bg-sunken ${n.readAt ? "" : "bg-accent-soft/40"}`}>
                <Link href={n.href} onClick={() => ref.current?.removeAttribute("open")} className="block min-w-0 flex-1 p-3">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-sm text-muted">{n.body}</p>
                </Link>
                <button type="button" onClick={() => remove(n.id)} aria-label={`Delete notification: ${n.title}`} className="m-1.5 shrink-0 rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink"><Icon name="x" size={16} /></button>
              </div>
            ))}
          </>
        )}
      </div>
    </details>
  );
}

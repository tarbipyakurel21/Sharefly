"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type T = { id: number; message: string; action?: { label: string; onClick: () => void }; tone?: "ok" | "error" };
const Ctx = createContext<(t: Omit<T, "id">) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((t: Omit<T, "id">) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { ...t, id }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), t.action ? 6000 : 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`rise pointer-events-auto flex items-center gap-4 rounded-xl px-4 py-3 text-sm shadow-[var(--shadow-soft)] ${t.tone === "error" ? "bg-bad text-white" : "bg-ink text-white"}`}>
            <span>{t.message}</span>
            {t.action && <button className="min-h-8 font-semibold underline underline-offset-2" onClick={() => { t.action!.onClick(); setItems((x) => x.filter((i) => i.id !== t.id)); }}>{t.action.label}</button>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

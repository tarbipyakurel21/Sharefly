"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errMsg } from "@/lib/client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

/** Two-step delete: the first press asks, the second removes the room and the furniture placed in it. */
export function DeleteRoomButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/rooms/${id}`, { method: "DELETE" });
      toast({ message: `Deleted ${name}.` });
      if (redirectTo) router.push(redirectTo); else router.refresh();
    } catch (e) { toast({ message: errMsg(e), tone: "error" }); setBusy(false); }
  }

  if (!asking) return <Button variant="ghost" onClick={() => setAsking(true)} aria-label={`Delete ${name}`}>Delete</Button>;
  return (
    <span role="group" aria-label={`Delete ${name}?`} className="inline-flex items-center gap-2">
      <span className="text-sm text-muted">Delete this room?</span>
      <Button variant="danger" onClick={remove} loading={busy}>Yes, delete</Button>
      <Button variant="ghost" onClick={() => setAsking(false)} disabled={busy}>Cancel</Button>
    </span>
  );
}

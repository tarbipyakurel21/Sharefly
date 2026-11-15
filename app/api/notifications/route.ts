import { z } from "zod";
import { ok, route, requireUser, jsonBody } from "@/lib/api";
import { deleteNotifications, listNotifications, markNotificationsRead, unreadCount } from "@/lib/db/queries";
import { getSessionUser } from "@/lib/auth";

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) return ok({ unread: 0, notifications: [] });
  return ok({ unread: await unreadCount(user.id), notifications: await listNotifications(user.id) });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const b = z.object({ id: z.string().optional() }).parse(await jsonBody(req).catch(() => ({})));
  await markNotificationsRead(user.id, b.id);
  return ok({ unread: await unreadCount(user.id) });
});

/** `?id=...` deletes one notification; no id clears all of the signed-in person's notifications. */
export const DELETE = route(async (req) => {
  const user = await requireUser();
  const id = z.string().min(1).max(80).optional().parse(new URL(req.url).searchParams.get("id") ?? undefined);
  await deleteNotifications(user.id, id);
  return ok({ unread: await unreadCount(user.id) });
});

import { z } from "zod";
import { ok, route, requireUser, jsonBody } from "@/lib/api";
import { listNotifications, markNotificationsRead, unreadCount } from "@/lib/db/queries";
import { getSessionUser } from "@/lib/auth";

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) return ok({ unread: 0, notifications: [] });
  return ok({ unread: unreadCount(user.id), notifications: listNotifications(user.id) });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const b = z.object({ id: z.string().optional() }).parse(await jsonBody(req).catch(() => ({})));
  markNotificationsRead(user.id, b.id);
  return ok({ unread: unreadCount(user.id) });
});

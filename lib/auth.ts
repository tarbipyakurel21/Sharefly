import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import { getUser } from "@/lib/db/queries";
import type { User } from "@/lib/db/types";

export const COOKIE = "sf_session";

function sig(value: string) {
  return crypto.createHmac("sha256", getEnv().SESSION_SECRET).update(value).digest("hex").slice(0, 32);
}
export const signSession = (userId: string) => `${userId}.${sig(userId)}`;
export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const id = token.slice(0, i), s = token.slice(i + 1);
  const expected = sig(id);
  if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
  return id;
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const id = verifySession(jar.get(COOKIE)?.value);
  return id ? getUser(id) : null;
}
export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(userId), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

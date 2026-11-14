import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUser } from "@/lib/auth";
import type { User } from "@/lib/db/types";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const ok = <T,>(data: T, status = 200) => NextResponse.json(data, { status });
export const fail = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status });

export async function requireUser(): Promise<User> {
  const u = await getSessionUser();
  if (!u) throw new ApiError(401, "signed_out", "Please sign in to do that.");
  return u;
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;
/** Wraps a route handler: converts thrown errors into `{ error: { code, message } }`. */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.status, e.code, e.message);
      if (e instanceof ZodError) return fail(400, "invalid_input", e.issues[0]?.message ?? "Some of that didn't look right.");
      console.error("[api]", req.method, new URL(req.url).pathname, e instanceof Error ? e.message : "unknown error");
      return fail(500, "server_error", "Something went wrong on our side. Please try again.");
    }
  };
}

export async function jsonBody(req: Request): Promise<unknown> {
  try { return await req.json(); } catch { throw new ApiError(400, "invalid_json", "We couldn't read that request."); }
}

// Simple in-memory limiter (per process). Good enough for a single-server hackathon deployment.
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) throw new ApiError(429, "slow_down", "That's a lot at once. Please wait a moment and try again.");
  arr.push(now);
  hits.set(key, arr);
}

"use client";

export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

/** Calls our API and throws an error whose message is already written for a person. */
export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers: json !== undefined ? { "content-type": "application/json", ...(rest.headers ?? {}) } : rest.headers, body: json !== undefined ? JSON.stringify(json) : rest.body });
  } catch {
    throw new ApiClientError(0, "network", "We couldn't reach ShareFly. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiClientError(res.status, data?.error?.code ?? "error", data?.error?.message ?? "Something went wrong. Please try again.");
  return data as T;
}
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");

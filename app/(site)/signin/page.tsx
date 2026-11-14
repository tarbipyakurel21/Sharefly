import type { Metadata } from "next";
import { SignInForm } from "@/components/layout/SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/browse";
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl">Welcome to ShareFly</h1>
      <p className="mb-6 mt-2 text-muted">Tell us who you are and you're in. No password needed.</p>
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-soft)]"><SignInForm next={safe} /></div>
    </div>
  );
}

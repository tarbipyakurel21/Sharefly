import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-display text-3xl">We couldn't find that page</h1>
      <p className="mt-2 text-muted">It may have moved, or the link might be a little off.</p>
      <div className="mt-6"><LinkButton href="/browse">Browse what's available</LinkButton></div>
    </div>
  );
}

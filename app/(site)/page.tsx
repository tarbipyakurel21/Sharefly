import { LinkButton } from "@/components/ui/Button";
import { ListingCard } from "@/components/listing/ListingCard";
import { listListings } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "1", t: "Snap a photo", b: "Take one picture of what you're giving away. We'll suggest a title and description you can change." },
  { n: "2", t: "Say what you need", b: "Tell us what you're looking for in your own words. We'll let you know when it turns up nearby." },
  { n: "3", t: "Check it fits, get it home", b: "Try the piece in a 3D copy of your room, then ask a neighbor with a car for help." },
];

export default async function Landing() {
  const recent = await listListings({ limit: 6 });
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 pt-4 md:grid-cols-[1.1fr_1fr] md:pt-10">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Giving something away should take seconds.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">Finding something you need should feel effortless. ShareFly connects neighbors who have things they no longer want with people who could really use them.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton href="/give" className="min-h-12 px-6 text-base">Give something away</LinkButton>
            <LinkButton href="/browse" variant="secondary" className="min-h-12 px-6 text-base">Find something you need</LinkButton>
          </div>
        </div>
        {recent[0]?.photoUrl && (
          <div className="relative hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={recent[0].photoUrl} alt={recent[0].title} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[var(--shadow-soft)]" />
          </div>
        )}
      </section>

      <section aria-labelledby="recent">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="recent" className="font-display text-2xl">Just listed near you</h2>
          <a href="/browse" className="min-h-11 py-2 font-semibold text-accent">See everything</a>
        </div>
        {recent.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">{recent.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        ) : <p className="text-muted">Nothing has been listed yet. Be the first to give something away.</p>}
      </section>

      <section aria-labelledby="how" className="rounded-3xl bg-sunken p-6 sm:p-10">
        <h2 id="how" className="font-display text-2xl">How it works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{s.n}</span>
              <div><h3 className="font-semibold">{s.t}</h3><p className="mt-1 text-muted">{s.b}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

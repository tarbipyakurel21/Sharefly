"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { api, errMsg } from "@/lib/client";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { NeighborhoodInput } from "@/components/ui/NeighborhoodInput";
import { SignInCard } from "@/components/layout/SignInForm";
import type { DescribeResult } from "@/lib/ai/types";

type Ai = "idle" | "working" | "done" | "failed";
const STORES = ["IKEA", "Amazon", "Walmart", "Target", "Wayfair", "Other"];

async function compress(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file); } catch { throw new Error("We couldn't open that photo. Try a JPEG or PNG instead."); }
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("We couldn't prepare that photo. Please try another.");
  if (blob.size > 10 * 1024 * 1024) throw new Error("That photo is still too big. Try a smaller one.");
  return { blob, width: w, height: h };
}

export function GiveFlow({ defaultNeighborhood }: { defaultNeighborhood: string | null }) {
  const clientKey = useRef(crypto.randomUUID());
  const [preview, setPreview] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ url: string; width: number; height: number } | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const blobRef = useRef<{ blob: Blob; name: string; width: number; height: number } | null>(null);
  const [ai, setAi] = useState<Ai>("idle");
  const [aiSource, setAiSource] = useState<"model" | "mock" | null>(null);
  const touched = useRef({ title: false, category: false, description: false });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [from, setFrom] = useState("");
  const [nb, setNb] = useState(defaultNeighborhood ?? "");
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [needSignIn, setNeedSignIn] = useState(false);
  const [done, setDone] = useState<{ id: string; matchCount: number; title: string } | null>(null);
  const [drag, setDrag] = useState(false);

  async function upload() {
    const b = blobRef.current;
    if (!b) return;
    setUploading(true); setPhotoErr(null);
    try {
      const fd = new FormData(); fd.append("file", b.blob, "photo.jpg");
      const r = await api<{ url: string }>("/api/uploads", { method: "POST", body: fd });
      setPhoto({ url: r.url, width: b.width, height: b.height });
    } catch (e) { setPhotoErr(errMsg(e)); } finally { setUploading(false); }
  }

  async function onFile(file: File | undefined | null) {
    if (!file) return;
    setPhotoErr(null); setPhoto(null); setAi("idle");
    let c;
    try { c = await compress(file); } catch (e) { setPhotoErr(errMsg(e)); return; }
    blobRef.current = { ...c, name: file.name };
    setPreview(URL.createObjectURL(c.blob));
    upload();
    setAi("working");
    try {
      const fd = new FormData(); fd.append("file", c.blob, "photo.jpg"); fd.append("fileName", file.name);
      const r = await api<DescribeResult>("/api/ai/describe-item", { method: "POST", body: fd });
      if (r.status === "ok") {
        if (!touched.current.title) setTitle(r.suggestion.title);
        if (!touched.current.category) setCategory(r.suggestion.category);
        if (!touched.current.description) setDescription(r.suggestion.description);
        setAiSource(r.source); setAi("done");
      } else setAi("failed");
    } catch { setAi("failed"); }
  }

  async function publish() {
    if (busy) return;
    if (title.trim().length < 3) { setErr("Please add a short title."); return; }
    if (!photo) { setErr(uploading ? "Your photo is still uploading. One moment." : "Your photo didn't upload yet. Tap Try again above."); return; }
    setBusy(true); setErr(null);
    try {
      const dollars = price !== null && price.trim() !== "" ? Math.round(parseFloat(price) * 100) : 0;
      if (Number.isNaN(dollars) || dollars < 0) throw new Error("Please enter a price like 10, or leave it free.");
      const r = await api<{ listing: { id: string; title: string }; matchCount: number }>("/api/listings", {
        method: "POST",
        json: {
          title: title.trim(), description: description.trim(), category, priceCents: dollars, conditionNote: condition.trim() || null,
          purchasedFrom: from.trim() || null, neighborhood: nb.trim() || null, aiGenerated: ai === "done" && aiSource === "model",
          photoUrl: photo.url, photoWidth: photo.width, photoHeight: photo.height, clientKey: clientKey.current,
        },
      });
      setDone({ id: r.listing.id, matchCount: r.matchCount, title: r.listing.title });
    } catch (e) {
      if (e instanceof Error && "status" in e && (e as { status: number }).status === 401) setNeedSignIn(true);
      else setErr(errMsg(e));
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="rise mx-auto max-w-lg space-y-5 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-good-soft text-good"><Icon name="check" size={28} /></div>
        <h1 className="font-display text-3xl">Thank you! It's up.</h1>
        <p className="text-muted">{done.matchCount > 0 ? `${done.matchCount} ${done.matchCount === 1 ? "person nearby is" : "people nearby are"} looking for something like this. We've let them know.` : "We'll let people know when someone is looking for something like this."}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href={`/items/${done.id}`}>See your listing</LinkButton>
          <LinkButton href="/give" variant="secondary">Give something else</LinkButton>
        </div>
      </div>
    );
  }

  const pickers = (
    <>
      <input id="file-lib" type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      <input id="file-cam" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
    </>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Give something away</h1>
        <p className="mt-1 text-muted">Start with one photo. That's all we need.</p>
      </div>
      {pickers}

      {!preview ? (
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
          className={`flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-colors ${drag ? "border-accent bg-accent-soft/50" : "border-line bg-surface"}`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent"><Icon name="camera" size={28} /></div>
          <p className="font-semibold">Add a photo of what you're giving away</p>
          <div className="flex flex-wrap justify-center gap-3">
            <label htmlFor="file-cam" className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-accent px-5 font-semibold text-white hover:bg-accent-hover md:hidden">Take a photo</label>
            <label htmlFor="file-lib" className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-line bg-surface px-5 font-semibold hover:bg-sunken md:bg-accent md:text-white md:hover:bg-accent-hover md:border-transparent">Choose a photo</label>
          </div>
          <p className="hidden text-sm text-muted md:block">or drag it here</p>
          {photoErr && <p role="alert" className="text-sm text-bad">{photoErr}</p>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your photo" className="max-h-96 w-full object-contain" />
            <label htmlFor="file-lib" className="absolute right-3 top-3 inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-surface/95 px-3 text-sm font-semibold shadow-[var(--shadow-soft)]">Change photo</label>
          </div>
          {photoErr && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-bad-soft p-3 text-sm text-bad">
              <span>{photoErr}</span><Button variant="secondary" onClick={upload} loading={uploading}>Try again</Button>
            </div>
          )}
          {ai === "working" && <p className="text-muted" aria-live="polite">Taking a look at your photo…</p>}
          {ai === "failed" && <p className="rounded-xl bg-warn-soft p-3 text-warn" role="status">We couldn't describe this one automatically. Add a quick title and you're set.</p>}
          {ai === "done" && <p className="text-sm text-muted" role="status">{aiSource === "model" ? "Suggested from your photo. Edit anything." : "Here's a starting point. Edit anything."}</p>}

          <div className="space-y-4">
            {ai === "working" ? (
              <div className="space-y-3"><div className="skeleton h-11" /><div className="skeleton h-11" /><div className="skeleton h-24" /></div>
            ) : (
              <>
                <Field label="Title" htmlFor="g-title"><TextInput id="g-title" value={title} onChange={(e) => { touched.current.title = true; setTitle(e.target.value); }} maxLength={80} placeholder="e.g. Wooden desk" /></Field>
                <Field label="Category" htmlFor="g-cat">
                  <Select id="g-cat" value={category} onChange={(e) => { touched.current.category = true; setCategory(e.target.value as Category); }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                  </Select>
                </Field>
                <Field label="Description" htmlFor="g-desc"><TextArea id="g-desc" rows={3} value={description} onChange={(e) => { touched.current.description = true; setDescription(e.target.value); }} maxLength={600} placeholder="What should people know?" /></Field>
              </>
            )}
          </div>

          <details className="rounded-2xl border border-line bg-surface p-4">
            <summary className="cursor-pointer font-semibold">Add a few details (optional)</summary>
            <div className="mt-4 space-y-4">
              <Field label="Condition, defects, or what's included" htmlFor="g-cond" hint="In your own words. We never guess this."><TextArea id="g-cond" rows={2} value={condition} onChange={(e) => setCondition(e.target.value)} maxLength={400} /></Field>
              <Field label="Where was it bought?" htmlFor="g-from">
                <TextInput id="g-from" list="stores" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={60} />
                <datalist id="stores">{STORES.map((s) => <option key={s} value={s} />)}</datalist>
              </Field>
              <Field label="Pickup neighborhood" htmlFor="g-nb" hint="Just the area, never your address."><NeighborhoodInput id="g-nb" value={nb} onChange={(e) => setNb(e.target.value)} /></Field>
            </div>
          </details>

          <div className="flex items-center justify-between text-[15px]">
            <span>Price: <strong className="text-good">{price === null || price.trim() === "" ? "Free" : `$${price}`}</strong></span>
            {price === null ? <button type="button" className="min-h-11 px-2 font-semibold text-accent" onClick={() => setPrice("")}>Change</button> : (
              <span className="flex items-center gap-2">$<TextInput aria-label="Price in dollars" inputMode="decimal" className="!w-24" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
                <button type="button" className="min-h-11 px-2 font-semibold text-accent" onClick={() => setPrice(null)}>Free</button></span>
            )}
          </div>

          {needSignIn && (
            <div className="rise"><SignInCard title="One last thing: who are you?" body="Your listing is ready. Sign in and we'll publish it." /><div className="mt-3 text-center"><Button onClick={() => { setNeedSignIn(false); publish(); }}>I've signed in, publish</Button></div></div>
          )}
          {err && <p role="alert" className="text-sm text-bad">{err}</p>}
          {!needSignIn && <Button onClick={publish} loading={busy} className="w-full min-h-12 text-base">Publish</Button>}
        </div>
      )}
      <p className="text-center text-sm text-muted"><Link href="/browse" className="underline">Just looking? Browse what's available</Link></p>
    </div>
  );
}

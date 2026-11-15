"use client";
import dynamic from "next/dynamic";
import type { ScanSize } from "./ScanViewer";

const ScanViewer = dynamic(() => import("./ScanViewer"), { ssr: false, loading: () => <div className="skeleton h-72 rounded-2xl" /> });

/** Read-only 3D scan for visitors. iPhone/iPad can also open a USDZ in AR Quick Look. */
export function ScanSection({ url, format, title, onSize }: { url: string; format: "glb" | "usdz"; title: string; onSize?: (s: ScanSize) => void }) {
  return (
    <div className="space-y-2">
      <ScanViewer url={url} format={format} title={title} onSize={onSize} />
      <p className="text-sm text-muted">3D scan from the owner. Drag to turn it.{format === "usdz" && <> On an iPhone you can <a rel="ar" href={url} className="font-semibold text-ink underline">view it in your room<img alt="" className="sr-only" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" /></a>.</>}</p>
    </div>
  );
}

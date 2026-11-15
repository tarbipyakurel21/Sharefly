"use client";
import { useEffect, useMemo, useState } from "react";
import type * as THREE from "three";
import type { Category } from "@/lib/categories";
import { buildFurniture, disposeFurniture } from "@/lib/room/model";
import { buildScanPiece, disposeScanPiece, type ScanRef } from "@/lib/room/scan-model";

type Props = { category: Category; w: number; d: number; h: number; ghost?: boolean; tint?: string | null; scan?: ScanRef | null };

/**
 * The giver's own 3D scan when the listing has one; otherwise (or while it loads, or if it can't be opened) a procedural
 * stand-in built from the measurements. Both are scaled to real meters.
 */
export function Furniture({ category, w, d, h, ghost, tint, scan }: Props) {
  const [scanObj, setScanObj] = useState<THREE.Group | null>(null);
  const scanUrl = scan?.url, scanFormat = scan?.format;
  useEffect(() => {
    if (!scanUrl || !scanFormat) { setScanObj(null); return; }
    let cancelled = false, built: THREE.Group | null = null;
    buildScanPiece({ url: scanUrl, format: scanFormat }, w, d, h, { ghost, tint })
      .then((g) => { if (cancelled) disposeScanPiece(g); else { built = g; setScanObj(g); } })
      .catch(() => { if (!cancelled) setScanObj(null); }); // fall back to the measurement-based model
    return () => { cancelled = true; if (built) disposeScanPiece(built); };
  }, [scanUrl, scanFormat, w, d, h, ghost, tint]);

  const stand = useMemo(() => (scanObj ? null : buildFurniture(category, w, d, h, { ghost, tint })), [scanObj, category, w, d, h, ghost, tint]);
  useEffect(() => () => { if (stand) disposeFurniture(stand); }, [stand]);
  return <primitive object={scanObj ?? stand!} />;
}

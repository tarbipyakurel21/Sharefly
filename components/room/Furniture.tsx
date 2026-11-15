"use client";
import { useEffect, useMemo } from "react";
import type { Category } from "@/lib/categories";
import { buildFurniture, disposeFurniture } from "@/lib/room/model";

type Props = { category: Category; w: number; d: number; h: number; ghost?: boolean; tint?: string | null };

/** Procedural furniture, scaled to real meters. Same geometry as the AR "View in your room" model. */
export function Furniture({ category, w, d, h, ghost, tint }: Props) {
  const obj = useMemo(() => buildFurniture(category, w, d, h, { ghost, tint }), [category, w, d, h, ghost, tint]);
  useEffect(() => () => disposeFurniture(obj), [obj]);
  return <primitive object={obj} />;
}

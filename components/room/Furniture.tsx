"use client";
import type { Category } from "@/lib/categories";

const COLORS: Partial<Record<Category, string>> = {
  desk: "#b0804f", chair: "#5b7a74", table: "#c49a6c", sofa: "#7d8aa0", bed: "#c9d2dc", mattress: "#d9dfe6", dresser: "#b8946a",
  bookshelf: "#8a6a47", storage: "#d8cdb0", lamp: "#e8c36a", rug: "#b95c50", other: "#b9b0a2",
};
const DARK = "#5f4630";

type Props = { category: Category; w: number; d: number; h: number; ghost?: boolean; tint?: string | null };

function Box({ p, s, c, ghost, tint }: { p: [number, number, number]; s: [number, number, number]; c: string; ghost?: boolean; tint?: string | null }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={tint ?? c} roughness={0.85} transparent={ghost} opacity={ghost ? 0.55 : 1} emissive={tint ?? "#000000"} emissiveIntensity={tint ? 0.25 : 0} />
    </mesh>
  );
}

/** Procedural furniture, scaled to real meters. Origin at the footprint centre on the floor. */
export function Furniture({ category, w, d, h, ghost, tint }: Props) {
  const c = COLORS[category] ?? COLORS.other!;
  const B = (p: [number, number, number], s: [number, number, number], col = c) => <Box p={p} s={s} c={col} ghost={ghost} tint={tint} />;
  const leg = 0.05, inset = 0.04;
  const legs = (top: number, col = DARK) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
    <Box key={i} p={[sx * (w / 2 - inset - leg / 2), top / 2, sz * (d / 2 - inset - leg / 2)]} s={[leg, top, leg]} c={col} ghost={ghost} tint={tint} />
  ));

  switch (category) {
    case "desk":
    case "table": {
      const t = 0.04;
      return <group>{B([0, h - t / 2, 0], [w, t, d])}{legs(h - t)}{category === "desk" && B([0, h * 0.62, -d / 2 + 0.06], [w - 0.12, h * 0.35, 0.02], DARK)}</group>;
    }
    case "chair": {
      const t = 0.05;
      return <group>{B([0, h * 0.5 - t / 2, 0], [w, t, d])}{legs(h * 0.5 - t)}{B([0, h * 0.75, -d / 2 + 0.025], [w, h * 0.5, 0.05])}</group>;
    }
    case "sofa":
      return <group>{B([0, h * 0.22, 0], [w, h * 0.44, d])}{B([0, h * 0.62, -d * 0.38], [w, h * 0.76, d * 0.24])}{B([-w / 2 + w * 0.05, h * 0.38, d * 0.05], [w * 0.1, h * 0.5, d * 0.9], DARK)}{B([w / 2 - w * 0.05, h * 0.38, d * 0.05], [w * 0.1, h * 0.5, d * 0.9], DARK)}</group>;
    case "bed":
      return <group>{B([0, h * 0.22, 0], [w, h * 0.44, d], DARK)}{B([0, h * 0.62, 0.02], [w * 0.96, h * 0.36, d * 0.94], "#e9e3da")}{B([0, h * 0.62, -d * 0.2], [w * 0.6, h * 0.2, d * 0.14], "#ffffff")}{B([0, h * 0.95, -d / 2 + 0.03], [w, h * 1.1, 0.06], c)}</group>;
    case "mattress":
      return B([0, h / 2, 0], [w, h, d], "#e9e3da");
    case "dresser":
      return <group>{B([0, h / 2, 0], [w, h, d])}{[0.2, 0.5, 0.8].map((f) => <Box key={f} p={[0, h * f, d / 2 + 0.004]} s={[w * 0.9, h * 0.26, 0.01]} c="#e8d9bd" ghost={ghost} tint={tint} />)}</group>;
    case "bookshelf": {
      const th = 0.03;
      return <group>{B([-w / 2 + th / 2, h / 2, 0], [th, h, d])}{B([w / 2 - th / 2, h / 2, 0], [th, h, d])}{B([0, h / 2, -d / 2 + 0.01], [w, h, 0.02], DARK)}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => <Box key={f} p={[0, Math.min(h - th / 2, Math.max(th / 2, h * f)), 0]} s={[w, th, d]} c={c} ghost={ghost} tint={tint} />)}</group>;
    }
    case "storage":
      return <group>{B([0, h / 2, 0], [w, h, d])}{B([0, h + 0.01, 0], [w + 0.02, 0.03, d + 0.02], DARK)}</group>;
    case "lamp": {
      const r = Math.min(w, d) / 2;
      return <group>
        <mesh position={[0, 0.02, 0]} castShadow><cylinderGeometry args={[r * 0.6, r * 0.6, 0.04, 20]} /><meshStandardMaterial color={DARK} transparent={ghost} opacity={ghost ? 0.55 : 1} /></mesh>
        <mesh position={[0, h * 0.4, 0]}><cylinderGeometry args={[0.012, 0.012, h * 0.8, 10]} /><meshStandardMaterial color={DARK} transparent={ghost} opacity={ghost ? 0.55 : 1} /></mesh>
        <mesh position={[0, h * 0.88, 0]} castShadow><cylinderGeometry args={[r * 0.55, r, h * 0.24, 24, 1, true]} /><meshStandardMaterial color={c} side={2} emissive={c} emissiveIntensity={0.35} transparent={ghost} opacity={ghost ? 0.55 : 1} /></mesh>
      </group>;
    }
    case "rug":
      return B([0, Math.max(h, 0.015) / 2, 0], [w, Math.max(h, 0.015), d]);
    default:
      return B([0, h / 2, 0], [w, h, d]);
  }
}

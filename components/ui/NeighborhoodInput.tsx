import { NEIGHBORHOODS } from "@/lib/geo/neighborhoods";
import { TextInput } from "./Field";
import type { InputHTMLAttributes } from "react";

export function NeighborhoodInput(p: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <TextInput {...p} list="neighborhoods" placeholder={p.placeholder ?? "e.g. Downtown Princeton"} autoComplete="off" />
      <datalist id="neighborhoods">{NEIGHBORHOODS.map((n) => <option key={n.name} value={n.name} />)}</datalist>
    </>
  );
}

"use client";
// Shared two-figure headline for ranked snapshot charts (top / bottom of the ranking), each with its own dated line.
// The source tag rides on the first date line at 390 (TagIn).
import type { ReactNode } from "react";
import { COUNTRIES } from "@/lib/series.mjs";
import { TagIn } from "./kit";
const NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.short]));
export type Fig = { code: string; label: string; value: ReactNode; unit?: string; date: string };
export function HeadFigs({ figs, tag }: { figs: Fig[]; tag: string }) {
  return <div className="figs">{figs.map((f, i) => (
    <div className="fig" key={f.code + i}><div className="figl">{f.label}</div><div className="figc"><span><i style={{ background: `var(--${f.code})` }} />{NAME[f.code]}</span></div>
      <div className={f.unit ? "figv pts" : "figv"}>{f.value}{f.unit && <span>{f.unit}</span>}</div><div className="figp">{f.date}{i === 0 && <TagIn tag={tag} />}</div></div>))}</div>;
}
// sign-aware labels at the displayed rounding (zero reads "No change")
export const rankLabels = (v: number, first: boolean, shown: number, L: { up: string; down: string; upSmall: string; downSmall: string }) =>
  shown === 0 ? "No change" : first ? (v > 0 ? L.up : L.downSmall) : (v < 0 ? L.down : L.upSmall);
export const sgn = (r: number, dp: number, suffix = "") => `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r).toFixed(dp)}${suffix}`;

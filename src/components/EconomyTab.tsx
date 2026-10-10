"use client";
import { useMemo, useRef } from "react";
import { econDataset } from "@/lib/series.mjs";
import Shell from "./Shell";
import ChartCard, { asOf } from "./ChartCard";
import Comeback from "./Comeback";
import { Lazy } from "./kit";

export const ECONOMY_CARDS = [{ id: "card-econ", title: "GDP" }, { id: "comeback", title: "The comeback race" }];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EconomyTab({ econ }: { econ: any }) {
  const sets = useMemo(() => ({ gdp: econDataset(econ, "gdp"), pc: econDataset(econ, "pc") }), [econ]);
  const initial = useRef<string | null>(null);
  if (initial.current === null && typeof window !== "undefined") initial.current = location.search;
  return (
    <Shell tab="economy" cards={ECONOMY_CARDS} asOf={asOf(econ.data_as_of.snapshot_id)}>
      <ChartCard kind="econ" sets={sets} primary initialSearch={initial} />
      <Lazy id="comeback" minHeight={1100}><Comeback econ={econ} initial={initial} /></Lazy>
    </Shell>
  );
}

export const qi: (p: string) => number;
export const qs: (i: number) => string;
export const ORDER: string[];
export const COMEBACK_BASE: string;
export const SCORE_BASE: string;
export const HEAT_STEPS: number;
export type CPoint = { period: string; qi: number; value: number | null; prov: boolean };
export function comeback(econ: unknown, view?: "pc" | "gdp"): { view: string; end: string; base: string; panels: { code: string; base: number | null; points: CPoint[]; back: string | null; last: number | null; own: { period: string; value: number | null } }[]; min: number; max: number };
export function scorecard(rate: unknown): { base: string; end: string; rows: { code: string; freq: "quarterly" | "annual"; start: number | null; end: number | null; change: number | null; est: boolean; own: { period: string; value: number | null; change: number | null; est: boolean } }[] };
export type HeatCell = { v: number | null; n: number; of: number; why?: string; from?: string; to?: string; unit?: string };
export const monLabel: (p: string) => string;
export function heatStrip(um: unknown, years: number): { end: string; unit: "month" | "quarter" | "year"; cols: { key: string; label: string; months: string[] }[]; rows: { code: string; freq: "monthly" | "quarterly" | "annual"; first: string; last: string; lastValue: number | null; vals: (number | null)[]; cells: HeatCell[]; ext?: { freq: "annual"; src: string; last: string }; splice?: { ci: number; label: string }[] }[]; min: number; max: number };
export function heatStep(v: number, min: number, max: number): number;
export const MON: string[];

export const perLabel: (p: string) => string;

export const COUNTRIES: { code: string; name: string; short: string }[];
export const WINDOWS: number[];
export const JAN_JUMPS: Record<string, string[]>;
export function commonEnds(data: unknown): { monthEnd: string; quarterEnd: string; monthEndIdx: number; quarterEndIdx: number };
export function buildLine(data: unknown, code: string, years: number): unknown;
export function monthlyGrowth(data: unknown, code: string, a: string, b: string): number | null;
export function mIdx(p: string): number;
export function mStr(i: number): string;
export function qOfMonth(mi: number): number;

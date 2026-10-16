export const NEW: string[];
export function g20<T>(a: T, b: any): T & { g20_sources?: Record<string, any>; g20_nodata?: string[]; g20_nonmonthly?: string[] };
export function present(file: any, code: string): boolean;
export function pickCodes<T>(file: T, codes: string[]): T;
export function citeLines(rec: any): string[];

export function freqOf(files: any[], code: string): "monthly" | "quarterly" | "annual" | null;
export const EURO_AREA_LABEL: string;
export function euLabel(files: any[]): string | null;

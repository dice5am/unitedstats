"use client";
import { useEffect, useRef, useState } from "react";
export default function Tween({ value, format }: { value: number; format: (v: number) => string }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(value); from.current = value; return; }
    const a = from.current, t0 = performance.now(); let raf = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 4);
    const step = (now: number) => { const t = Math.min(1, (now - t0) / 400); setV(a + (value - a) * ease(t)); if (t < 1) raf = requestAnimationFrame(step); else from.current = value; };
    raf = requestAnimationFrame(step); return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value]);
  return <>{format(v)}</>;
}

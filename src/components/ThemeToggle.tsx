"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.dataset.theme === "light" ? "light" : "dark");
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onSys = () => {
      if (localStorage.getItem("us-theme")) return; // user chose; stop following system
      const t = mq.matches ? "light" : "dark"; root.dataset.theme = t; setTheme(t);
    };
    mq.addEventListener("change", onSys);
    return () => mq.removeEventListener("change", onSys);
  }, []);
  const flip = () => {
    const t = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("us-theme", t); } catch {}
    setTheme(t);
  };
  const light = theme === "light";
  return (
    <button className="toggle" onClick={flip} aria-label={light ? "Switch to dark theme" : "Switch to light theme"}>
      {light ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" /></svg>
      )}
    </button>
  );
}

import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";

const font = Be_Vietnam_Pro({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mono" });

export const metadata: Metadata = { title: "unitedstats", description: "Economy, labour and society across the G20. Data: OECD, BIS, IMF, World Bank, ILOSTAT." };
export const viewport: Viewport = {
  width: "device-width", initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0B0B0E" }, { media: "(prefers-color-scheme: light)", color: "#F6F3EC" }],
};

// Runs before first paint: stored choice, else system. No flash.
const themeScript = `(function(){try{var s=localStorage.getItem('us-theme');var t=s||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

// Design lock 2026-10-16: classic (space-taking) scrollbars only: once a scrollbar takes width, mark <html> so CSS can
// reserve the gutter for good. Sticky (never removed), so the detection itself can never oscillate. Overlay scrollbars
// (phones, macOS, the test browser) never trigger it: no gutter, no width change.
const sbScript = `(function(){var c='has-classic-scrollbar',h=document.documentElement,ro;function k(){if(h.classList.contains(c)){if(ro)ro.disconnect();removeEventListener('resize',k);return;}if(innerWidth-h.clientWidth>0)k(h.classList.add(c));}
addEventListener('resize',k);function s(){k();if(window.ResizeObserver&&document.body&&!h.classList.contains(c)){ro=new ResizeObserver(k);ro.observe(document.body);}}if(document.body)s();else document.addEventListener('DOMContentLoaded',s);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${font.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><script dangerouslySetInnerHTML={{ __html: sbScript }} /></head>
      <body>{children}</body>
    </html>
  );
}

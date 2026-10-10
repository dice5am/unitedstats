import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

const font = Be_Vietnam_Pro({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "United Stats · Canada vs the world",
  description: "Canada compared with the G7, one chart at a time. Data: OECD.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0B0B0E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className={font.className}><body>{children}</body></html>);
}

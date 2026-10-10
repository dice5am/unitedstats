import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "United Stats · Canada vs the world",
  description: "Canada compared with the G7, one chart at a time. Data: OECD.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f1115" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}

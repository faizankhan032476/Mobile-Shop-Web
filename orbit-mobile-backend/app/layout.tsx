import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HideOnAdmin } from "@/components/layout/HideOnAdmin";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: { default: "Orbit Mobile: smartphones in Pakistan (demo)", template: "%s | Orbit Mobile" },
  description: "Frontend-only demo of a single-owner mobile phone shop. Products and orders are simulated.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:bg-white focus:p-3">Skip to content</a>
        <HideOnAdmin><Navbar /></HideOnAdmin>
        <main id="main" className="flex-1">{children}</main>
        <HideOnAdmin><Footer /></HideOnAdmin>
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppToaster } from "@/components/ui/AppToaster";
import "./globals.css";

// latin-ext so Turkish and other European letters in titles render in Inter too.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Docs",
  description: "A lightweight collaborative document editor",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
        >
          Skip to content
        </a>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}

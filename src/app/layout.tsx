import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DeckForge — Yu-Gi-Oh! Deck Builder & Tester",
    template: "%s | DeckForge",
  },
  description:
    "Build, test, and analyze your Yu-Gi-Oh! decks. Simulate opening hands, check consistency, and calculate probabilities.",
  keywords: ["yu-gi-oh", "deck builder", "hand test", "consistency", "ygopro"],
  openGraph: {
    title: "DeckForge",
    description: "Professional Yu-Gi-Oh! deck building and testing platform.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080b12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

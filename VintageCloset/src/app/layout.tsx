import type { Metadata } from "next";
import { inter, spaceGrotesk } from "@/lib/fonts";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { KeyboardShortcuts } from "@/components/providers/KeyboardShortcuts";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vintage Closet | Vienna",
  description: "Modern vintage store in Vienna.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-surface text-ink font-sans relative min-h-screen flex flex-col`}
      >
        <CartProvider>
          <SmoothScroll />
          <KeyboardShortcuts />
          <div className="noise-overlay" />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </CartProvider>
      </body>
    </html>
  );
}

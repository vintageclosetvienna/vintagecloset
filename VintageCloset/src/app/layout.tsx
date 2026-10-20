import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { inter, spaceGrotesk } from "@/lib/fonts";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { KeyboardShortcuts } from "@/components/providers/KeyboardShortcuts";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { CartProvider } from "@/lib/cart";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SOCIAL_LINKS } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Vintage Closet | Vienna",
  description: "Modern vintage store in Vienna.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Vintage Closet | Vienna",
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_AT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vintage Closet | Vienna",
    description: SITE_DESCRIPTION,
  },
};

// Tells search engines which social profiles belong to the shop
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/vintage-closet-logo.png`,
  sameAs: Object.values(SOCIAL_LINKS),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <CartProvider>
          <SmoothScroll />
          <KeyboardShortcuts />
          <div className="noise-overlay" />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </CartProvider>
        {/* Vercel Web Analytics + Speed Insights (cookieless, nothing visible on the page) */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

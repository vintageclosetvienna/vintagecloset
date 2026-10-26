import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { inter, spaceGrotesk } from "@/lib/fonts";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { KeyboardShortcuts } from "@/components/providers/KeyboardShortcuts";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { CartProvider } from "@/lib/cart";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SOCIAL_LINKS, STORES, STORE_HOURS, STORE_CONTACT } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages set their own title; the shop name is added after it
  title: {
    default: "Vintage Closet Vienna | Vintage & Second Hand Shop in Wien",
    template: "%s | Vintage Closet Vienna",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["vintage shop Wien", "vintage Vienna", "second hand Wien", "90s streetwear", "vintage clothing", "Spitalgasse", "Taborstraße"],
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

// Tells search engines which social profiles belong to the shop, and where the two stores are (Google Maps / local results)
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "@id": `${SITE_URL}/#store`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/vintage-closet-logo.png`,
  image: `${SITE_URL}/opengraph-image.png`,
  description: SITE_DESCRIPTION,
  telephone: STORE_CONTACT.phone,
  email: STORE_CONTACT.email,
  priceRange: "€€",
  currenciesAccepted: "EUR",
  sameAs: Object.values(SOCIAL_LINKS),
  department: STORES.map(store => ({
    "@type": "ClothingStore",
    name: `${SITE_NAME} – ${store.name}`,
    telephone: STORE_CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.street,
      postalCode: store.postalCode,
      addressLocality: "Wien",
      addressCountry: "AT",
    },
    geo: { "@type": "GeoCoordinates", latitude: store.lat, longitude: store.lng },
    hasMap: store.mapsUrl,
    openingHoursSpecification: STORE_HOURS.map(h => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
  })),
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

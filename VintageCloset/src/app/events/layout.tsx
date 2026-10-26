import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "Pop-ups, markets and vintage events from Vintage Closet Vienna.",
  alternates: { canonical: "/events" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

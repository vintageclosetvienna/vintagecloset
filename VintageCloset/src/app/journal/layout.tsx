import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal",
  description: "Stories on vintage culture, style, garment care and Vienna city guides from Vintage Closet Vienna.",
  alternates: { canonical: "/journal" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

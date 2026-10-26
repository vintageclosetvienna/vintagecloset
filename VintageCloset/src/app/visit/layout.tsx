import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visit Our Stores in Vienna",
  description: "Vintage Closet Vienna: Spitalgasse 13, 1090 Wien and Taborstraße 56, 1020 Wien. Mon–Fri 11–19, Sat 10–18. Directions, phone and opening hours.",
  alternates: { canonical: "/visit" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

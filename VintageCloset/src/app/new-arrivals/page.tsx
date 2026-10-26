import type { Metadata } from "next";
import { NewArrivals } from "@/components/landing/NewArrivals";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest vintage pieces, freshly added to the Vienna archive. New drops every week, online and in our stores.",
  alternates: { canonical: "/new-arrivals" },
};

export default function NewArrivalsPage() {
  return <NewArrivals asPage />;
}

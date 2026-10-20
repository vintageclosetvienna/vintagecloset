import type { Metadata } from "next";
import { NewArrivals } from "@/components/landing/NewArrivals";

export const metadata: Metadata = {
  title: "New Arrivals | Vintage Closet Vienna",
  description: "The latest vintage pieces, freshly added to the Vienna archive.",
};

export default function NewArrivalsPage() {
  return <NewArrivals asPage />;
}

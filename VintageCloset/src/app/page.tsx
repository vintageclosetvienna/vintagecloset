import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { NewArrivals } from "@/components/landing/NewArrivals";
import { CalloutBanner } from "@/components/landing/CalloutBanner";
import { MediaCarousel } from "@/components/landing/MediaCarousel";
import { LookbookDecks } from "@/components/landing/LookbookDecks";
import { DiscoverDesigners } from "@/components/landing/DiscoverDesigners";
import { StoreStory } from "@/components/landing/StoreStory";
import { CollectionHighlights } from "@/components/landing/CollectionHighlights";
import { CapabilitiesStrip } from "@/components/landing/CapabilitiesStrip";
import { GeneratedListingPreview } from "@/components/landing/GeneratedListingPreview";
import { Stats } from "@/components/landing/Stats";
import { JournalEventsTeaser } from "@/components/landing/JournalEventsTeaser";
import { CallToAction } from "@/components/landing/CallToAction";

// Only the home page claims the bare address; other pages set their own canonical
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="flex flex-col gap-0 md:gap-8 lg:gap-12 pb-12">
      <CalloutBanner />
      <Hero />
      <NewArrivals limit={3} />
      <MediaCarousel />
      <LookbookDecks />
      <DiscoverDesigners />
      
      <StoreStory />
      <CapabilitiesStrip />
      
      <CollectionHighlights />
      <GeneratedListingPreview />
      <Stats />
      <JournalEventsTeaser />
      <CallToAction />
    </div>
  );
}

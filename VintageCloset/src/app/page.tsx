import { Hero } from "@/components/landing/Hero";
import { CalloutBanner } from "@/components/landing/CalloutBanner";
import { MediaCarousel } from "@/components/landing/MediaCarousel";
import { StoreStory } from "@/components/landing/StoreStory";
import { CollectionHighlights } from "@/components/landing/CollectionHighlights";
import { CapabilitiesStrip } from "@/components/landing/CapabilitiesStrip";
import { GeneratedListingPreview } from "@/components/landing/GeneratedListingPreview";
import { Stats } from "@/components/landing/Stats";
import { JournalEventsTeaser } from "@/components/landing/JournalEventsTeaser";
import { CallToAction } from "@/components/landing/CallToAction";

export default function Home() {
  return (
    <div className="flex flex-col gap-0 md:gap-8 lg:gap-12 pb-12">
      <CalloutBanner />
      <Hero />
      <MediaCarousel />
      
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

'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/shared/Reveal';
import { SafeImage } from '@/components/ui/SafeImage';
import { getLandingHeroImages, type SiteImage } from '@/lib/site-images';

// Fallback images
const FALLBACK_IMAGES = {
  left: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
  center: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop',
  right: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop',
};

export function Hero() {
  const [heroImages, setHeroImages] = useState<{
    left: SiteImage | null;
    center: SiteImage | null;
    right: SiteImage | null;
  }>({ left: null, center: null, right: null });

  useEffect(() => {
    async function fetchImages() {
      try {
        const images = await getLandingHeroImages();
        setHeroImages(images);
      } catch (error) {
        console.error('Error fetching hero images:', error);
      }
    }
    fetchImages();
  }, []);

  const leftImage = heroImages.left?.url || FALLBACK_IMAGES.left;
  const centerImage = heroImages.center?.url || FALLBACK_IMAGES.center;
  const rightImage = heroImages.right?.url || FALLBACK_IMAGES.right;

  return (
    <section className="relative min-h-[85vh] flex items-center pt-24 md:pt-32 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Text Content */}
        <div className="order-1 lg:order-1 space-y-8 relative z-20 text-center lg:text-left mx-auto max-w-xl lg:max-w-none w-full">
          <Reveal delay={0.1}>
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-accent-start inline-block px-3 py-1 bg-accent-start/5 rounded-full mb-2">
              Vienna Flagship
            </p>
          </Reveal>
          
          <Reveal delay={0.2}>
            <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-ink">
              Vintage Closet<br />
              <span className="text-gradient">Vienna.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.3}>
            <p className="text-muted text-lg md:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Curated archive of 90s streetwear and luxury essentials. 
              Authentic pieces sourced globally, housed in Vienna.
            </p>
          </Reveal>

          <Reveal delay={0.4} className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
            <Button size="lg" className="w-full sm:w-auto min-w-[160px] shadow-sm hover:shadow-md">
              Shop Latest Drop
            </Button>
            <Button variant="ghost" size="lg" className="w-full sm:w-auto min-w-[160px] group">
              Visit Store <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="pt-8 flex items-center justify-center lg:justify-start gap-4 text-xs font-medium text-muted">
               <div className="h-px w-12 bg-hairline" />
               <p>NEXT DROP: FEB 24</p>
            </div>
          </Reveal>
        </div>

        {/* Visuals */}
        <div className="order-2 lg:order-2 relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center perspective-[1000px]">
          {/* Back Left Image */}
          <Reveal direction="scale" delay={0.7} className="absolute left-0 md:left-8 top-1/2 -translate-y-1/2 w-[45%] md:w-[40%] aspect-[3/4] z-0 origin-center">
             <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg -rotate-6 opacity-80 brightness-90">
                <SafeImage 
                   src={leftImage}
                   alt="Vintage Mood 1"
                   fill
                   className="object-cover"
                />
             </div>
          </Reveal>

          {/* Back Right Image */}
          <Reveal direction="scale" delay={0.7} className="absolute right-0 md:right-8 top-1/2 -translate-y-1/2 w-[45%] md:w-[40%] aspect-[3/4] z-0 origin-center">
             <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg rotate-6 opacity-80 brightness-90">
                <SafeImage 
                   src={rightImage}
                   alt="Vintage Mood 2"
                   fill
                   className="object-cover"
                />
             </div>
          </Reveal>

          {/* Main Center Image */}
          <Reveal direction="up" delay={0.5} className="relative z-10 w-[65%] md:w-[60%] aspect-[3/4]">
             <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gray-100 border-4 border-white transform hover:-translate-y-2 transition-transform duration-500">
                <SafeImage 
                   src={centerImage}
                   alt="Vintage Clothing Rack"
                   fill
                   className="object-cover"
                   priority
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-sm whitespace-nowrap">
                  SHOT IN VIENNA
                </div>
             </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
}

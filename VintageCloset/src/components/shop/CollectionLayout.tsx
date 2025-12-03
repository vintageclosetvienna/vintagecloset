'use client';

import React, { useEffect, useState } from 'react';
import { FilterRail } from '@/components/shop/FilterRail';
import { Reveal } from '@/components/shared/Reveal';
import { SafeImage } from '@/components/ui/SafeImage';
import { getCollectionHero } from '@/lib/site-images';

// Fallback images
const FALLBACK_HEROES: Record<string, string> = {
  women: 'https://images.unsplash.com/photo-1550614000-4b9519e40569?q=80&w=2070&auto=format&fit=crop',
  men: 'https://images.unsplash.com/photo-1617114919297-3c8dd6caea94?q=80&w=1964&auto=format&fit=crop',
  unisex: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2070&auto=format&fit=crop',
};

interface CollectionLayoutProps {
  title: string;
  description: string;
  heroImage?: string; // Now optional - will fetch from Supabase if not provided
  gender: 'women' | 'men' | 'unisex';
  children: React.ReactNode;
}

export function CollectionLayout({ title, description, heroImage: propHeroImage, gender, children }: CollectionLayoutProps) {
  const [heroImage, setHeroImage] = useState<string>(propHeroImage || FALLBACK_HEROES[gender]);

  useEffect(() => {
    // If a heroImage was passed as prop, use it
    if (propHeroImage) {
      setHeroImage(propHeroImage);
      return;
    }

    // Otherwise fetch from Supabase
    async function fetchHeroImage() {
      try {
        const url = await getCollectionHero(gender);
        setHeroImage(url);
      } catch (error) {
        console.error('Error fetching collection hero image:', error);
      }
    }
    fetchHeroImage();
  }, [gender, propHeroImage]);

  return (
    <>
      <div className="relative min-h-[60vh] md:min-h-[50vh] flex items-end pb-12 md:items-center overflow-hidden">
         <SafeImage 
            src={heroImage} 
            alt={title} 
            fill 
            className="object-cover"
            priority
         />
         <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent md:bg-gradient-to-r md:from-ink/80 md:to-transparent" />
         
         <div className="container mx-auto px-4 relative z-10">
            <Reveal>
               <h1 className="text-5xl md:text-8xl font-display font-bold text-white mb-4">{title}</h1>
               <p className="text-lg md:text-xl text-white/80 max-w-md leading-relaxed">{description}</p>
            </Reveal>
         </div>
      </div>

      <FilterRail gender={gender} />
      
      <div className="min-h-screen bg-surface">
         <div className="container mx-auto px-4 py-8 md:py-12">
            {children}
         </div>
      </div>
    </>
  );
}

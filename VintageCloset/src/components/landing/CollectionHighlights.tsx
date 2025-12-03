'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Reveal } from '@/components/shared/Reveal';
import { SafeImage } from '@/components/ui/SafeImage';
import { ArrowRight } from '@phosphor-icons/react';
import { getCollectionHighlightsImages, type SiteImage } from '@/lib/site-images';

// Fallback images
const FALLBACK_COLLECTIONS = [
  { title: 'Women', href: '/women', image: 'https://images.unsplash.com/photo-1550614000-4b9519e40569?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Men', href: '/men', image: 'https://images.unsplash.com/photo-1617114919297-3c8dd6caea94?q=80&w=1964&auto=format&fit=crop' },
  { title: 'Unisex', href: '/unisex', image: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2070&auto=format&fit=crop' },
];

export function CollectionHighlights() {
  const [highlightImages, setHighlightImages] = useState<{
    women: SiteImage | null;
    men: SiteImage | null;
    unisex: SiteImage | null;
  }>({ women: null, men: null, unisex: null });

  useEffect(() => {
    async function fetchImages() {
      try {
        const images = await getCollectionHighlightsImages();
        setHighlightImages(images);
      } catch (error) {
        console.error('Error fetching collection highlight images:', error);
      }
    }
    fetchImages();
  }, []);

  const collections = [
    { 
      title: 'Women', 
      href: '/women', 
      image: highlightImages.women?.url || FALLBACK_COLLECTIONS[0].image 
    },
    { 
      title: 'Men', 
      href: '/men', 
      image: highlightImages.men?.url || FALLBACK_COLLECTIONS[1].image 
    },
    { 
      title: 'Unisex', 
      href: '/unisex', 
      image: highlightImages.unisex?.url || FALLBACK_COLLECTIONS[2].image 
    },
  ];

  return (
    <section className="pb-12 md:pb-24 pt-0">
       <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
             {collections.map((col, idx) => (
               <Reveal key={idx} delay={idx * 0.1} className="group block relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500">
                  <Link href={col.href} className="block w-full h-full">
                    <SafeImage 
                      src={col.image} 
                      alt={col.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex items-end justify-between">
                       <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          <span className="inline-block px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider text-ink bg-white/90 backdrop-blur rounded-full shadow-sm">
                             Collection
                          </span>
                          <h3 className="text-3xl lg:text-4xl font-display font-bold text-white">{col.title}</h3>
                       </div>
                       <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-ink translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                          <ArrowRight weight="bold" size={20} />
                       </div>
                    </div>
                  </Link>
               </Reveal>
             ))}
          </div>
       </div>
    </section>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/shared/Reveal';
import { Image as ImageIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { getMediaCarouselImages, type SiteImage } from '@/lib/site-images';

export function MediaCarousel() {
  const [carouselImages, setCarouselImages] = useState<SiteImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      try {
        const images = await getMediaCarouselImages();
        setCarouselImages(images);
      } catch (error) {
        console.error('Error fetching carousel images:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchImages();
  }, []);

  // Hide section entirely if no images and not loading
  if (!isLoading && carouselImages.length === 0) {
    return null;
  }

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <section className="py-12 md:py-24 overflow-hidden bg-surface">
        <div className="flex overflow-hidden">
          <div className="flex gap-4 md:gap-8 px-4 md:px-6 pb-12">
            {[...Array(4)].map((_, idx) => (
              <div 
                key={idx} 
                className="relative flex-shrink-0 w-[85vw] md:w-[35vw] aspect-video rounded-2xl overflow-hidden bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const mediaItems = carouselImages.map(img => ({ src: img.url, label: img.description }));
  
  // Duplicate items for seamless loop
  const items = [...mediaItems, ...mediaItems];

  return (
    <section className="py-12 md:py-24 overflow-hidden bg-surface">
       <Reveal width="100%">
          <div className="flex overflow-hidden">
            <motion.div 
              className="flex gap-4 md:gap-8 px-4 md:px-6 pb-12"
              animate={{ x: ["-50%", "0%"] }}
              transition={{ 
                repeat: Infinity, 
                ease: "linear", 
                duration: 30,
              }}
              style={{ width: "max-content" }}
            >
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="relative flex-shrink-0 w-[85vw] md:w-[35vw] aspect-video rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-500"
                >
                   <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                   <Image 
                     src={item.src} 
                     alt={item.label} 
                     fill 
                     className="object-cover transition-transform duration-700 group-hover:scale-105 relative z-10" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 z-20 pointer-events-none" />
                   
                   {/* Overlay */}
                   <div className="absolute bottom-6 left-6 z-30 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                         <ImageIcon className="text-white" size={14} />
                      </div>
                      <span className="text-white text-sm font-medium tracking-wide shadow-sm">{item.label}</span>
                   </div>
                </div>
              ))}
            </motion.div>
          </div>
       </Reveal>
    </section>
  );
}

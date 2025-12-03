'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Reveal } from '@/components/shared/Reveal';
import { SafeImage } from '@/components/ui/SafeImage';
import { Image as ImageIcon } from '@phosphor-icons/react';
import { motion, useAnimationControls } from 'framer-motion';
import { getMediaCarouselImages, type SiteImage } from '@/lib/site-images';

export function MediaCarousel() {
  const [carouselImages, setCarouselImages] = useState<SiteImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentX = useRef(0);

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

  // Start auto-scroll animation
  const startAutoScroll = (fromX: number) => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.scrollWidth / 2;
    // Normalize position to be within bounds
    const normalizedX = ((fromX % containerWidth) + containerWidth) % containerWidth;
    const targetX = normalizedX - containerWidth;
    
    // Calculate remaining duration based on position
    const progress = normalizedX / containerWidth;
    const remainingDuration = 30 * (1 - progress);
    
    controls.start({
      x: [fromX, targetX],
      transition: {
        repeat: Infinity,
        ease: "linear",
        duration: remainingDuration > 0 ? remainingDuration : 30,
      }
    });
  };

  // Initialize animation when images load
  useEffect(() => {
    if (carouselImages.length > 0 && !isDragging) {
      startAutoScroll(0);
    }
  }, [carouselImages]);

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
          <div className="flex overflow-hidden cursor-grab active:cursor-grabbing">
            <motion.div 
              ref={containerRef}
              className="flex gap-4 md:gap-8 px-4 md:px-6 pb-12"
              animate={controls}
              drag="x"
              dragConstraints={{ left: -10000, right: 10000 }}
              dragElastic={0}
              onDragStart={() => {
                setIsDragging(true);
                controls.stop();
              }}
              onDrag={(_, info) => {
                currentX.current = info.point.x;
              }}
              onDragEnd={(_, info) => {
                setIsDragging(false);
                // Get current transform and continue from there
                if (containerRef.current) {
                  const transform = window.getComputedStyle(containerRef.current).transform;
                  const matrix = new DOMMatrix(transform);
                  startAutoScroll(matrix.m41);
                }
              }}
              style={{ width: "max-content", touchAction: "pan-y" }}
            >
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="relative flex-shrink-0 w-[85vw] md:w-[35vw] aspect-video rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-500"
                >
                   <div className="absolute inset-0 bg-gray-200" />
                   <SafeImage 
                     src={item.src} 
                     alt={item.label || 'Carousel image'} 
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

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImageSquare } from '@phosphor-icons/react';

interface ProductGalleryProps {
  images: string[];
}

// Gallery image with error handling
function GalleryImage({ 
  src, 
  alt, 
  fill = true,
  priority = false,
  className = ''
}: { 
  src: string; 
  alt: string; 
  fill?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const isValidSrc = src && typeof src === 'string' && src.length > 0 && src !== 'null' && src !== 'undefined';
  
  if (!isValidSrc || hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <ImageSquare size={48} weight="thin" className="text-gray-300 mx-auto" />
          <p className="text-xs text-gray-400 mt-2">No image</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </>
  );
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  // magnifier (his ask 31 Oct): with a mouse, the photo zooms in 2.4× where the pointer is, so the leather grain and seams show
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
         {/* Main Image */}
         <div 
            className={cn("relative aspect-[3/4] w-full bg-gray-100 rounded-2xl overflow-hidden shadow-lg group", zoom ? "cursor-zoom-in" : "cursor-pointer")}
            onClick={() => setIsLightboxOpen(true)}
            onPointerMove={onMove}
            onPointerLeave={() => setZoom(null)}
         >
            <AnimatePresence mode="wait">
               <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
               >
                  <div
                     className="absolute inset-0 transition-transform duration-200 ease-out will-change-transform"
                     style={zoom ? { transform: 'scale(2.4)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                  >
                     <GalleryImage 
                        src={images[activeImage]} 
                        alt="Product Main" 
                        className="object-cover" 
                        priority
                     />
                  </div>
               </motion.div>
            </AnimatePresence>
            
            {/* Zoom Hint */}
            <div className={cn("absolute inset-x-0 bottom-4 flex justify-center pointer-events-none transition-opacity", zoom ? "opacity-0" : "opacity-0 group-hover:opacity-100")}>
               <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  Move to magnify · click for full view
               </span>
            </div>
         </div>

         {/* Thumbnails */}
         <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {images.map((img, idx) => (
               <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                     "relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                     activeImage === idx ? "border-accent-start scale-105 shadow-md" : "border-transparent hover:border-hairline opacity-70 hover:opacity-100"
                  )}
               >
                  <GalleryImage src={img} alt={`View ${idx + 1}`} className="object-cover" />
               </button>
            ))}
         </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
         {isLightboxOpen && (
            <>
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-ink/95 backdrop-blur-md z-[100]"
                  onClick={() => setIsLightboxOpen(false)}
               />
               <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                  onClick={() => setIsLightboxOpen(false)}
               >
                  <button 
                     className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-ink transition-colors"
                     onClick={() => setIsLightboxOpen(false)}
                  >
                     <X size={24} weight="bold" />
                  </button>
                  
                  <div className="relative w-full max-w-5xl aspect-[4/5] rounded-2xl overflow-hidden">
                     <GalleryImage 
                        src={images[activeImage]} 
                        alt="Product Full View" 
                        className="object-contain"
                     />
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
    </>
  );
}

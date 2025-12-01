'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/shared/Reveal';
import { CheckCircle, MagnifyingGlass, Eye, Heart, Star } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorySlidesImages, type SiteImage } from '@/lib/site-images';

// Fallback story data with default images
const FALLBACK_STORY_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?q=80&w=1935&auto=format&fit=crop',
    title: 'Vintage Pattern Shirt',
    location: 'Personal Archive',
    tags: ['90s', 'Pattern', 'Cotton', 'Rare'],
    story:
      "This isn't just a shirt—it's the very first piece that made me fall in love with vintage. Pulled from a closing warehouse in Berlin, it still smells faintly of cedar.",
    highlights: [
      { icon: MagnifyingGlass, title: 'The Dig', desc: 'Unearthed in Kreuzberg, preserved with cedar blocks for years.' },
      { icon: Eye, title: 'Expert Eye', desc: 'Hand-finished seams, original mother-of-pearl buttons intact.' },
      { icon: Heart, title: "Curator's Choice", desc: 'Pairs with raw denim and beat-up sneakers for the perfect clash.' },
    ],
  },
  {
    image: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1935&auto=format&fit=crop',
    title: 'Italian Leather Moto',
    location: 'Collector Estate',
    tags: ['80s', 'Leather', 'Moto', 'Limited'],
    story:
      "Found while cataloging an old racer's estate outside Milan. The patina on this jacket tells stories of backroads and espresso stops.",
    highlights: [
      { icon: Star, title: 'Road Proven', desc: 'Scuffs and sun-fade carefully conditioned—not erased.' },
      { icon: Eye, title: 'Expert Eye', desc: 'Original Talon zip, quilted lining still intact.' },
      { icon: Heart, title: "Curator's Choice", desc: 'Throw over a tee, let the jacket do the talking.' },
    ],
  },
  {
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop',
    title: 'Carpenter Denim',
    location: 'Warehouse Pull',
    tags: ['Workwear', 'Stonewash', 'Wide-leg', 'USA'],
    story:
      'Straight out of a defunct hardware store in Ohio. These jeans hit that sweet spot between relaxed and structured.',
    highlights: [
      { icon: MagnifyingGlass, title: 'Utility Gold', desc: 'Paint freckles left on purpose, pockets reinforced.' },
      { icon: Eye, title: 'Expert Eye', desc: 'Union tags confirm late 80s production run.' },
      { icon: Heart, title: "Curator's Choice", desc: 'Roll the hem, show off your favorite sneakers.' },
    ],
  },
];

export function GeneratedListingPreview() {
  const [currentImage, setCurrentImage] = useState(0);
  const [storySlides, setStorySlides] = useState(FALLBACK_STORY_SLIDES);

  useEffect(() => {
    async function fetchImages() {
      try {
        const images = await getStorySlidesImages();
        if (images.length > 0) {
          // Update story slides with fetched images
          const updatedSlides = FALLBACK_STORY_SLIDES.map((slide, idx) => ({
            ...slide,
            image: images[idx]?.url || slide.image,
            title: images[idx]?.description || slide.title,
          }));
          setStorySlides(updatedSlides);
        }
      } catch (error) {
        console.error('Error fetching story slide images:', error);
      }
    }
    fetchImages();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % storySlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [storySlides.length]);

  const activeSlide = storySlides[currentImage];

  return (
    <section className="py-16 overflow-hidden bg-gradient-to-b from-surface to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Image Side */}
          <Reveal direction="right" className="relative order-1 lg:order-1 w-full">
            <div className="relative aspect-[3/4] w-full rounded-[28px] overflow-hidden shadow-2xl border border-white/40 bg-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide.image}
                  initial={{ x: 140, opacity: 0, rotate: 3, scale: 0.95 }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                    transition: { type: 'spring', stiffness: 140, damping: 15, mass: 0.9 },
                  }}
                  exit={{ x: -140, opacity: 0, rotate: -2, transition: { duration: 0.4 } }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeSlide.image}
                    alt={activeSlide.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              
              {/* Floating Overlay Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeSlide.title}-card`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-5 right-5 left-5 bg-white/85 backdrop-blur-md shadow-xl rounded-xl p-4 border border-white/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold text-ink text-base">{activeSlide.title}</h3>
                      <p className="text-[10px] text-muted uppercase tracking-wider mt-1">{activeSlide.location}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 p-1 rounded-full">
                      <CheckCircle size={16} weight="fill" />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {activeSlide.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide bg-surface text-muted border border-hairline">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>

          {/* Content Side */}
          <div className="order-2 lg:order-2 space-y-8">
            <Reveal>
              <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-[1.1]">
                Born from the<br />
                <span className="text-gradient">Archive.</span>
              </h2>
            </Reveal>
            
            <AnimatePresence mode="wait">
              <motion.p
                key={`${activeSlide.title}-story`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="text-muted text-base md:text-lg leading-relaxed max-w-lg"
              >
                {activeSlide.story}
              </motion.p>
            </AnimatePresence>

            <AnimatePresence mode="wait">
               <motion.div
                 key={`${activeSlide.title}-highlights`}
                 initial={{ opacity: 0, y: 16 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -16 }}
                 transition={{ duration: 0.3 }}
                 className="space-y-5"
               >
                  {activeSlide.highlights.map((item, i) => (
                    <div key={`${item.title}-${i}`} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-hairline group cursor-default">
                       <div className="mt-1 p-2.5 bg-accent-start/10 rounded-xl text-accent-start group-hover:scale-110 transition-transform">
                          <item.icon size={20} weight="duotone" className="group-hover:rotate-12 transition-transform" />
                       </div>
                       <div>
                          <h4 className="font-bold text-ink text-base mb-1">{item.title}</h4>
                          <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                       </div>
                    </div>
                  ))}
               </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}

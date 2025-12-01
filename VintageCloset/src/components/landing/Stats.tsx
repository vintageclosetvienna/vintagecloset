'use client';

import { Reveal } from '@/components/shared/Reveal';
import { Quotes } from '@phosphor-icons/react';

const STATS = [
  { value: '10k+', label: 'Items Curated' },
  { value: '500+', label: 'Happy Collectors' },
  { value: '24h', label: 'Shipping Time' },
];

const TESTIMONIAL = {
  text: "The best vintage selection in Vienna. Found a rare 90s Adidas jacket that looks brand new. The curation is next level.",
  author: "Sophie M.",
  role: "Stylist"
};

export function Stats() {
  return (
    <section className="py-24 lg:py-32 bg-ink text-white relative overflow-hidden">
       {/* Background decoration */}
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-accent" />
       <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-accent-start/10 rounded-full blur-[100px] pointer-events-none" />

       <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
             
             {/* Stats Grid */}
             <div className="grid grid-cols-2 gap-x-8 gap-y-16 md:gap-16">
                {STATS.map((stat, idx) => (
                   <Reveal key={idx} delay={idx * 0.1} className="space-y-3 text-center lg:text-left">
                      <div className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 tracking-tight">
                         {stat.value}
                      </div>
                      <div className="text-sm font-bold uppercase tracking-[0.15em] text-accent-start">
                         {stat.label}
                      </div>
                   </Reveal>
                ))}
             </div>

             {/* Testimonial */}
             <Reveal direction="left" delay={0.3} className="relative max-w-xl mx-auto lg:mx-0">
                <Quotes size={64} weight="fill" className="text-accent-start/10 absolute -top-12 -left-8 lg:-left-12 rotate-12" />
                <blockquote className="text-2xl md:text-3xl font-light leading-relaxed text-white/90 relative z-10 tracking-wide">
                   &quot;{TESTIMONIAL.text}&quot;
                </blockquote>
                <div className="mt-10 flex items-center gap-4">
                   <div className="h-12 w-12 rounded-full bg-gradient-accent p-[2px]">
                      <div className="h-full w-full rounded-full bg-ink flex items-center justify-center text-sm font-bold">
                        SM
                      </div>
                   </div>
                   <div>
                      <div className="font-bold text-white text-lg">{TESTIMONIAL.author}</div>
                      <div className="text-sm text-white/50 uppercase tracking-wider font-medium">{TESTIMONIAL.role}</div>
                   </div>
                </div>
             </Reveal>

          </div>
       </div>
    </section>
  );
}

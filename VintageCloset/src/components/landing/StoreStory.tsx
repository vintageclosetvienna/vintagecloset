'use client';

import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/shared/Reveal';
import { ArrowRight, Heart } from '@phosphor-icons/react';

export function StoreStory() {
  return (
    <section className="pt-24 pb-24 relative">
       <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
             <Reveal direction="up" className="relative p-10 md:p-16 rounded-3xl bg-white/80 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white/50 overflow-hidden text-center hover:shadow-[0_12px_60px_rgba(0,177,187,0.08)] transition-shadow duration-700">
                {/* Decorative gradient orb */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent-start/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center space-y-8">
                   <div className="w-12 h-12 rounded-full bg-accent-start/5 flex items-center justify-center text-accent-start mb-2">
                      <Heart weight="duotone" size={24} />
                   </div>

                   <h2 className="font-display font-bold text-4xl md:text-5xl text-ink tracking-tight">
                      From Vienna,<br />
                      <span className="text-gradient">With Love.</span>
                   </h2>
                   
                   <p className="text-muted text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
                      We are a team of vintage enthusiasts based in the heart of Vienna. 
                      Our mission is to curate the finest 90s and 00s clothing, bringing sustainable fashion to a new generation.
                   </p>
                   
                   <Button variant="secondary" className="rounded-full px-8 border-accent-start/20 hover:border-accent-start text-ink hover:bg-white group">
                      Read our Story <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform text-accent-start" />
                   </Button>
                </div>
             </Reveal>
          </div>
       </div>
    </section>
  );
}

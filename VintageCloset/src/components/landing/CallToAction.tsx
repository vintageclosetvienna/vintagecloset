'use client';

import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from '@phosphor-icons/react';

export function CallToAction() {
  return (
    <section className="py-12 md:py-24 px-4 bg-surface">
       <div className="container mx-auto flex justify-center">
          <Reveal className="relative rounded-[2.5rem] overflow-hidden bg-[#050E12] text-white px-6 py-20 md:p-24 text-center shadow-2xl border border-white/5 group max-w-5xl w-full">
             {/* Subtle animated background glow */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl bg-accent-start/5 blur-[120px] rounded-full pointer-events-none" />
             
             <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                <h2 className="text-4xl md:text-6xl font-display font-bold leading-[1.1] tracking-tight">
                   Ready to find your <br />
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-start via-white to-accent-end">next favorite piece?</span>
                </h2>
                <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-xl mx-auto">
                   Join thousands of vintage lovers. New items drop every week.
                   Don&apos;t miss out on one-of-a-kind gems.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-4">
                   <Button size="lg" className="w-full sm:w-auto min-w-[180px] h-14 text-base font-bold shadow-lg hover:shadow-accent-start/20">
                      Shop Now
                   </Button>
                   <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[180px] h-14 text-base font-bold bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm">
                      Visit Store <ArrowRight className="ml-2" />
                   </Button>
                </div>
             </div>
          </Reveal>
       </div>
    </section>
  );
}

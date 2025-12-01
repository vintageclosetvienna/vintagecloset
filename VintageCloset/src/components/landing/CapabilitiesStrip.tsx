'use client';

import { Reveal } from '@/components/shared/Reveal';
import { CoatHanger, CheckCircle, Globe, Recycle } from '@phosphor-icons/react';

const CAPABILITIES = [
  { icon: CoatHanger, label: 'Handpicked in Vienna', text: 'Every piece curated individually by our team.' },
  { icon: CheckCircle, label: 'Quality Verified', text: 'Washed, steamed, and authenticity checked.' },
  { icon: Globe, label: 'Worldwide Shipping', text: 'Fast, tracked delivery from Austria.' },
  { icon: Recycle, label: 'Sustainable Choice', text: 'Circulate fashion. Reduce waste.' },
];

export function CapabilitiesStrip() {
  return (
    <section className="pb-0 pt-0 bg-surface">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 max-w-6xl mx-auto">
          {CAPABILITIES.map((cap, idx) => (
            <Reveal key={idx} delay={idx * 0.1} direction="up" className="flex flex-col items-center text-center space-y-4 group">
              <div className="h-14 w-14 rounded-2xl bg-white border border-hairline flex items-center justify-center text-accent-start shadow-sm group-hover:-rotate-6 group-hover:scale-110 transition-transform duration-300">
                <cap.icon size={28} weight="duotone" />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm uppercase tracking-wide mb-2">{cap.label}</h4>
                <p className="text-sm text-muted max-w-[160px] mx-auto leading-relaxed">{cap.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import Image from 'next/image';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/Button';
import { MapPin, Clock, Phone } from '@phosphor-icons/react';

export default function VisitPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-var(--header-height))]">
         
         {/* Info Side */}
         <div className="p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-white order-2 lg:order-1">
            <Reveal>
               <h1 className="text-4xl md:text-6xl font-display font-bold mb-8 text-ink">Visit the Archive</h1>
               <p className="text-lg text-muted leading-relaxed mb-12">
                  Located in the heart of Vienna&apos;s creative district. 
                  Come browse our full collection, try on rare pieces, or just say hello.
               </p>

               <div className="space-y-8 mb-12">
                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-gray-50 rounded-full text-accent-start">
                        <MapPin size={24} weight="duotone" />
                     </div>
                     <div>
                        <h3 className="font-bold text-ink mb-1">Address</h3>
                        <p className="text-muted">Spitalgasse 13<br/>1090 Wien, Austria</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-gray-50 rounded-full text-accent-start">
                        <Clock size={24} weight="duotone" />
                     </div>
                     <div>
                        <h3 className="font-bold text-ink mb-1">Opening Hours</h3>
                        <p className="text-muted">Mon - Fri: 11:00 - 19:00<br/>Sat: 10:00 - 18:00<br/>Sun: Closed</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-gray-50 rounded-full text-accent-start">
                        <Phone size={24} weight="duotone" />
                     </div>
                     <div>
                        <h3 className="font-bold text-ink mb-1">Contact</h3>
                        <p className="text-muted">+43 681 10709980<br/>hello@vintagecloset.at</p>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4">
                  <Button size="lg">Get Directions</Button>
                  <Button variant="secondary" size="lg">Book Appointment</Button>
               </div>
            </Reveal>
         </div>

         {/* Image/Map Side */}
         <div className="relative h-[50vh] lg:h-auto bg-gray-200 order-1 lg:order-2 overflow-hidden">
            <Image 
               src="https://images.unsplash.com/photo-1552374196-c4e7ffc6e194?q=80&w=1887&auto=format&fit=crop" 
               alt="Store Interior" 
               fill 
               className="object-cover hover:scale-105 transition-transform duration-[2s]"
            />
            <div className="absolute inset-0 bg-ink/10 pointer-events-none" />
         </div>

      </div>
    </div>
  );
}



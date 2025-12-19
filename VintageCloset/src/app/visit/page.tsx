'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/Button';
import { MapPin, Clock, Phone, X } from '@phosphor-icons/react';

const SHOPS = [
  {
    name: 'Spitalgasse',
    address: 'Spitalgasse 13',
    city: '1090 Wien, Austria',
    mapsUrl: 'https://www.google.com/maps/place/Vintage+closet+1090/@48.2168996,16.3510508,17z/data=!3m1!5s0x476d07c11fad15f5:0xcfd8600dc7f637aa!4m6!3m5!1s0x476d07001dcad353:0x81ddaa4a935620a6!8m2!3d48.2169518!4d16.3511499!16s%2Fg%2F11v_89tdjh?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D'
  },
  {
    name: 'Taborstraße',
    address: 'Taborstraße 56',
    city: '1020 Wien, Austria',
    mapsUrl: 'https://www.google.com/maps/place/Vintage+Closet+1020/@48.2210385,16.3791008,17z/data=!3m1!4b1!4m6!3m5!1s0x476d07fdb8751e41:0xd7b93878f3214d2a!8m2!3d48.221035!4d16.3816757!16s%2Fg%2F11vkgltttq?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D'
  }
];

export default function VisitPage() {
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleGetDirections = (mapsUrl: string) => {
    window.open(mapsUrl, '_blank');
    setShowLocationModal(false);
  };

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
                        <h3 className="font-bold text-ink mb-1">Locations</h3>
                        <p className="text-muted">
                          Spitalgasse 13, 1090 Wien<br/>
                          Taborstraße 56, 1020 Wien
                        </p>
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
                        <p className="text-muted">+43 681 10709980<br/>vintageclosetvienna@gmail.com</p>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4">
                  <Button size="lg" onClick={() => setShowLocationModal(true)}>Get Directions</Button>
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

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowLocationModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-display font-bold text-ink mb-2">Choose Location</h2>
            <p className="text-muted text-sm mb-6">Select which store you&apos;d like directions to:</p>
            
            <div className="space-y-3">
              {SHOPS.map((shop) => (
                <button
                  key={shop.name}
                  onClick={() => handleGetDirections(shop.mapsUrl)}
                  className="w-full p-4 border border-hairline rounded-lg hover:border-accent-start hover:bg-accent-start/5 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <MapPin size={20} weight="duotone" className="text-accent-start mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-ink group-hover:text-accent-start transition-colors">{shop.name}</h3>
                      <p className="text-sm text-muted">{shop.address}</p>
                      <p className="text-sm text-muted">{shop.city}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



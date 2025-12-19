'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, InstagramLogo, FacebookLogo, TiktokLogo, Envelope, Phone, X } from '@phosphor-icons/react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export function Footer() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <footer className="bg-surface border-t border-hairline pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo />
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              Curated vintage clothing for the modern wardrobe. 
              Based in Vienna, shipping worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-ink">Shop</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/women" className="hover:text-accent-start transition-colors">Women</Link></li>
              <li><Link href="/men" className="hover:text-accent-start transition-colors">Men</Link></li>
              <li><Link href="/unisex" className="hover:text-accent-start transition-colors">Unisex</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-accent-start transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-ink">Support</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/faq" className="hover:text-accent-start transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-accent-start transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/visit" className="hover:text-accent-start transition-colors">Visit Store</Link></li>
              <li>
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="hover:text-accent-start transition-colors"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-ink">Newsletter</h4>
            <p className="text-sm text-muted">First dibs on drops and events.</p>
            <form className="relative flex items-center">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-transparent border-b border-hairline py-2 text-sm text-ink focus:outline-none focus:border-accent-start transition-colors placeholder:text-muted/50"
              />
              <button type="button" className="absolute right-0 p-2 text-ink hover:text-accent-start transition-colors">
                <ArrowRight size={16} />
              </button>
            </form>
            <div className="flex items-center space-x-4 pt-2">
              <a href="https://www.instagram.com/vintage_closet_vienna" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent-start transition-colors"><InstagramLogo size={20} /></a>
              <a href="https://www.tiktok.com/@vintage_closet_vienna" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent-start transition-colors"><TiktokLogo size={20} /></a>
              <a href="https://www.facebook.com/profile.php?id=61567529122786" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent-start transition-colors"><FacebookLogo size={20} /></a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-hairline flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} Vintage Closet Vienna. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-ink">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-display font-bold text-ink mb-2">Contact Us</h2>
            <p className="text-muted text-sm mb-6">Choose how you&apos;d like to get in touch</p>
            
            <div className="space-y-3">
              {/* Email Option */}
              <a
                href="mailto:vintage.closet.vienna@gmail.com"
                className="w-full p-4 border border-hairline rounded-lg hover:border-accent-start hover:bg-accent-start/5 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-accent-start/10 flex items-center justify-center group-hover:bg-accent-start/20 transition-colors flex-shrink-0">
                  <Envelope size={24} weight="duotone" className="text-accent-start" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink group-hover:text-accent-start transition-colors">Send Email</h3>
                  <p className="text-sm text-muted truncate">vintage.closet.vienna@gmail.com</p>
                </div>
              </a>

              {/* Phone Option */}
              <a
                href="tel:+436811070980"
                className="w-full p-4 border border-hairline rounded-lg hover:border-accent-start hover:bg-accent-start/5 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-accent-start/10 flex items-center justify-center group-hover:bg-accent-start/20 transition-colors flex-shrink-0">
                  <Phone size={24} weight="duotone" className="text-accent-start" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink group-hover:text-accent-start transition-colors">Call Us</h3>
                  <p className="text-sm text-muted">+43 681 10709980</p>
                </div>
              </a>
            </div>

            <p className="text-xs text-muted text-center mt-6">
              We typically respond within 24 hours
            </p>
          </div>
        </div>
      )}
    </footer>
  );
}



'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/cart';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear the cart after successful checkout
    clearCart();
    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [clearCart]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-start/20" />
          <p className="text-muted">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-24">
      <div className="bg-white rounded-2xl border border-hairline shadow-sm p-8 md:p-12 max-w-lg w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center">
            <CheckCircle size={44} weight="fill" className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-display font-bold text-ink text-center mb-3">
          Thank You!
        </h1>

        {/* Description */}
        <p className="text-muted text-center mb-8">
          Your order has been confirmed. We&apos;ll send you a confirmation email shortly with your order details.
        </p>

        {/* Order Reference Box */}
        <div className="bg-gray-50 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-center gap-3 text-ink mb-2">
            <Package size={22} weight="duotone" className="text-accent-start" />
            <span className="font-bold">Order Confirmed</span>
          </div>
          {sessionId && (
            <p className="text-xs text-muted font-mono text-center">
              Reference: {sessionId.slice(0, 24)}...
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full gap-2" size="lg">
              Continue Shopping
              <ArrowRight size={18} weight="bold" />
            </Button>
          </Link>
          <Link href="/women">
            <Button variant="ghost" className="w-full" size="lg">
              Browse Collection
            </Button>
          </Link>
        </div>

        {/* Contact Info */}
        <p className="text-xs text-muted text-center mt-8">
          Questions about your order? Contact us at{' '}
          <a href="mailto:vintage.closet.vienna@gmail.com" className="text-accent-start hover:underline">
            vintage.closet.vienna@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-start/20" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}


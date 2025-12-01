'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/shared/Reveal';
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
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [clearCart]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-start/20" />
          <p className="text-muted">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <Reveal>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center">
            <CheckCircle size={40} weight="fill" className="text-white" />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="text-3xl font-display font-bold text-ink mb-3">
            Thank You!
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-muted mb-8">
            Your order has been confirmed. We&apos;ll send you a confirmation email shortly with your order details.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="bg-surface rounded-xl p-6 mb-8 border border-hairline">
            <div className="flex items-center justify-center gap-3 text-ink mb-4">
              <Package size={24} weight="duotone" className="text-accent-start" />
              <span className="font-medium">Order Confirmed</span>
            </div>
            {sessionId && (
              <p className="text-xs text-muted font-mono break-all">
                Reference: {sessionId.slice(0, 20)}...
              </p>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full gap-2">
                Continue Shopping
                <ArrowRight size={16} weight="bold" />
              </Button>
            </Link>
            <Link href="/women" className="block">
              <Button variant="ghost" className="w-full">
                Browse Collection
              </Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.5}>
          <p className="text-xs text-muted mt-8">
            Questions about your order? Contact us at{' '}
            <a href="mailto:hello@vintagecloset.at" className="text-accent-start hover:underline">
              hello@vintagecloset.at
            </a>
          </p>
        </Reveal>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
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


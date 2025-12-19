'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft, ShoppingBag } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/shared/Reveal';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <Reveal>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface border border-hairline flex items-center justify-center">
            <XCircle size={40} weight="duotone" className="text-muted" />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="text-3xl font-display font-bold text-ink mb-3">
            Payment Cancelled
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-muted mb-8">
            Your payment was cancelled. Don&apos;t worry, no charges were made. Your item is still available if you&apos;d like to complete your purchase.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="bg-surface rounded-xl p-6 mb-8 border border-hairline">
            <p className="text-sm text-ink">
              <strong>Need help?</strong> Our team is here to assist you with any questions about your order or payment.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="space-y-3">
            <Button 
              onClick={() => window.history.back()} 
              className="w-full gap-2"
            >
              <ArrowLeft size={16} weight="bold" />
              Return to Product
            </Button>
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full gap-2">
                <ShoppingBag size={16} weight="bold" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.5}>
          <p className="text-xs text-muted mt-8">
            Having trouble? Contact us at{' '}
            <a href="mailto:vintageclosetvienna@gmail.com" className="text-accent-start hover:underline">
              vintageclosetvienna@gmail.com
            </a>
          </p>
        </Reveal>
      </div>
    </div>
  );
}


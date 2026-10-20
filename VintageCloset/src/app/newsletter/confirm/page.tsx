import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NewsletterAction } from '../NewsletterAction';

export const metadata: Metadata = { title: 'Confirm your email | Vintage Closet', robots: { index: false } };

export default function Page() {
  return (
    <section className="container mx-auto max-w-xl px-4 py-24 md:py-32 text-center">
      <Suspense fallback={null}>
        <NewsletterAction mode="confirm" />
      </Suspense>
    </section>
  );
}

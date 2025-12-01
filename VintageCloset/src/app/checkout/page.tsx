'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag, CreditCard, Lock } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/cart';

interface ShippingInfo {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    customerName: '',
    customerEmail: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: 'Austria',
  });

  // Redirect to home if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items, router]);

  const updateField = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const isValid = 
    shippingInfo.customerName.trim() !== '' &&
    shippingInfo.customerEmail.trim() !== '' &&
    shippingInfo.customerEmail.includes('@') &&
    shippingInfo.shippingAddress.trim() !== '' &&
    shippingInfo.shippingCity.trim() !== '' &&
    shippingInfo.shippingPostalCode.trim() !== '' &&
    shippingInfo.shippingCountry.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || items.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: items[0].id,
          productSlug: items[0].slug,
          shippingInfo,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.error) {
        setError(data.error);
        setIsSubmitting(false);
      } else {
        setError('Unable to start checkout. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-surface pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-4"
          >
            <ArrowLeft size={16} weight="bold" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-ink">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left - Shipping Form */}
          <div className="order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl border border-hairline p-6 space-y-4">
                <h2 className="text-lg font-display font-bold text-ink">Contact Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={shippingInfo.customerEmail}
                    onChange={(e) => updateField('customerEmail', e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full h-12 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
                  />
                  <p className="text-xs text-muted mt-1">We'll send your order confirmation here</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl border border-hairline p-6 space-y-4">
                <h2 className="text-lg font-display font-bold text-ink">Shipping Address</h2>
                
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.customerName}
                    onChange={(e) => updateField('customerName', e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full h-12 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.shippingAddress}
                    onChange={(e) => updateField('shippingAddress', e.target.value)}
                    placeholder="Neubaugasse 12"
                    required
                    className="w-full h-12 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.shippingCity}
                      onChange={(e) => updateField('shippingCity', e.target.value)}
                      placeholder="Vienna"
                      required
                      className="w-full h-12 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.shippingPostalCode}
                      onChange={(e) => updateField('shippingPostalCode', e.target.value)}
                      placeholder="1070"
                      required
                      className="w-full h-12 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={shippingInfo.shippingCountry}
                    onChange={(e) => updateField('shippingCountry', e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-lg border border-hairline bg-white text-ink focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
                  >
                    <option value="Austria">Austria</option>
                    <option value="Germany">Germany</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Italy">Italy</option>
                    <option value="France">France</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Czech Republic">Czech Republic</option>
                    <option value="Hungary">Hungary</option>
                    <option value="Slovakia">Slovakia</option>
                    <option value="Slovenia">Slovenia</option>
                    <option value="Poland">Poland</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Spain">Spain</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Norway">Norway</option>
                    <option value="Finland">Finland</option>
                  </select>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-base font-bold"
                disabled={!isValid || isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting ? (
                  'Redirecting to Payment...'
                ) : (
                  <>
                    <CreditCard className="mr-2" size={20} weight="bold" />
                    Pay with Stripe
                  </>
                )}
              </Button>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted">
                <Lock size={14} />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </form>
          </div>

          {/* Right - Order Summary */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-hairline p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-display font-bold text-ink mb-6 flex items-center gap-2">
                <ShoppingBag size={20} />
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-ink text-sm">{item.title}</h3>
                      <p className="text-xs text-muted uppercase mt-1">Size: {item.size}</p>
                      <p className="text-sm font-medium mt-2">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-hairline pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium">{getSubtotal()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-ink pt-2 border-t border-dashed border-hairline mt-2">
                  <span>Total</span>
                  <span>{getSubtotal()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

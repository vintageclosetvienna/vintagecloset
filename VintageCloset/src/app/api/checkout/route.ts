import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getProductById, getPriceAsNumber } from '@/lib/data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { validateDiscountCode, useDiscountCode, calculateDiscount } from '@/lib/discount-codes';

interface ShippingInfo {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe secret key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Initialize Stripe with the secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    });

    const body = await request.json();
    const { productId, productSlug, shippingInfo, discountCode, deliveryMethod, pickupCode } = body as {
      productId?: string;
      productSlug?: string;
      shippingInfo?: Partial<ShippingInfo>;
      discountCode?: string | null;
      deliveryMethod?: 'shipping' | 'pickup';
      pickupCode?: string | null;
    };

    const isPickup = deliveryMethod === 'pickup';

    // Validate email (required for both methods)
    const customerEmail = shippingInfo?.customerEmail;
    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate shipping info only for shipping orders
    let customerName = '';
    let shippingAddress = '';
    let shippingCity = '';
    let shippingPostalCode = '';
    let shippingCountry = '';

    if (!isPickup) {
      if (!shippingInfo) {
        return NextResponse.json(
          { error: 'Shipping information is required' },
          { status: 400 }
        );
      }

      customerName = shippingInfo.customerName || '';
      shippingAddress = shippingInfo.shippingAddress || '';
      shippingCity = shippingInfo.shippingCity || '';
      shippingPostalCode = shippingInfo.shippingPostalCode || '';
      shippingCountry = shippingInfo.shippingCountry || '';

      if (!customerName || !shippingAddress || !shippingCity || !shippingPostalCode || !shippingCountry) {
        return NextResponse.json(
          { error: 'All shipping fields are required' },
          { status: 400 }
        );
      }
    } else {
      // For pickup, validate pickup code
      if (!pickupCode) {
        return NextResponse.json(
          { error: 'Pickup code is required for in-store pickup' },
          { status: 400 }
        );
      }
      customerName = 'In-Store Pickup';
      shippingAddress = 'Abholung im Store';
      shippingCity = 'Vienna';
      shippingPostalCode = '-';
      shippingCountry = 'Austria';
    }

    // Fetch the actual product from database
    let product = null;
    
    if (productId) {
      product = await getProductById(productId);
    } else if (productSlug) {
      // Import getProduct if needed
      const { getProduct } = await import('@/lib/data');
      product = await getProduct(productSlug);
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is already sold
    if (product.isSold) {
      return NextResponse.json(
        { error: 'This product has already been sold' },
        { status: 400 }
      );
    }

    // Calculate prices
    const originalPrice = getPriceAsNumber(product.price);
    const productDiscount = product.discount || 0;
    let priceAfterProductDiscount = productDiscount > 0 
      ? originalPrice * (1 - productDiscount / 100)
      : originalPrice;

    // Validate and apply discount code if provided
    let discountCodeData: {
      code: string;
      type: 'percentage' | 'fixed';
      value: number;
      amount: number;
    } | null = null;

    if (discountCode && discountCode.trim()) {
      const validation = await validateDiscountCode(
        discountCode.trim(),
        product.id,
        priceAfterProductDiscount
      );

      if (validation.isValid && validation.discountType && validation.discountValue !== null) {
        const discountAmount = calculateDiscount(
          validation.discountType,
          validation.discountValue,
          priceAfterProductDiscount
        );

        discountCodeData = {
          code: discountCode.trim().toUpperCase(),
          type: validation.discountType,
          value: validation.discountValue,
          amount: discountAmount,
        };
      } else {
        return NextResponse.json(
          { error: validation.errorMessage || 'Ungültiger Gutscheincode' },
          { status: 400 }
        );
      }
    }

    // Calculate final price with discount code
    const finalPrice = discountCodeData 
      ? Math.max(0, priceAfterProductDiscount - discountCodeData.amount)
      : priceAfterProductDiscount;

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Checkout Session with all product details
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.title,
              images: product.images.length > 0 ? [product.images[0]] : [],
              description: `Size: ${product.size}${product.era ? ` | Era: ${product.era}` : ''}`,
            },
            unit_amount: Math.round(finalPrice * 100), // Convert to cents
          },
          quantity: 1, // Vintage items are unique, always 1
        },
      ],
      mode: 'payment',
      // Pre-fill customer email
      customer_email: customerEmail,
      // Success and cancel URLs
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      // Store all product and shipping info in metadata for webhook processing
      metadata: {
        productId: product.id,
        productSlug: product.slug,
        productName: product.title,
        size: product.size,
        productImage: product.images[0] || '',
        originalPrice: originalPrice.toString(),
        productDiscount: productDiscount.toString(),
        discountCode: discountCodeData?.code || '',
        discountCodeType: discountCodeData?.type || '',
        discountCodeValue: discountCodeData?.value.toString() || '',
        discountCodeAmount: discountCodeData?.amount.toString() || '',
        finalPrice: finalPrice.toString(),
        gender: product.gender,
        category: product.category,
        // Delivery method
        deliveryMethod: isPickup ? 'pickup' : 'shipping',
        pickupCode: pickupCode || '',
        // Shipping info
        customerName,
        customerEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingCountry,
      },
    });

    // Mark discount code as used (increment usage count)
    if (discountCodeData && isSupabaseConfigured()) {
      try {
        await useDiscountCode(discountCodeData.code);
      } catch (err) {
        console.error('Error marking discount code as used:', err);
        // Don't fail the checkout, just log the error
      }
    }

    // Create a pending order in the database if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const orderData = {
          product_id: product.id,
          stripe_session_id: session.id,
          status: 'pending',
          customer_name: customerName,
          customer_email: customerEmail,
          shipping_address: isPickup ? `ABHOLUNG - Code: ${pickupCode}` : shippingAddress,
          shipping_city: shippingCity,
          shipping_postal_code: shippingPostalCode,
          shipping_country: shippingCountry,
          original_price: originalPrice,
          discount_applied: productDiscount,
          discount_code: discountCodeData?.code || null,
          discount_code_amount: discountCodeData?.amount || 0,
          final_price: finalPrice,
          product_title: product.title,
          product_size: product.size,
          product_image: product.images[0] || null,
        };
        
        const { error: orderError } = await supabase
          .from('orders')
          .insert(orderData as never);

        if (orderError) {
          console.error('Error creating pending order:', orderError);
          // Don't fail the checkout, just log the error
        }
      } catch (dbError) {
        console.error('Database error creating order:', dbError);
        // Don't fail the checkout, just log the error
      }
    }

    // Return the checkout URL for redirect
    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    );
  }
}

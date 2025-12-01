import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getProductById, getPriceAsNumber } from '@/lib/data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
      apiVersion: '2025-04-30.basil',
    });

    const body = await request.json();
    const { productId, productSlug, shippingInfo } = body as {
      productId?: string;
      productSlug?: string;
      shippingInfo?: ShippingInfo;
    };

    // Validate shipping info
    if (!shippingInfo) {
      return NextResponse.json(
        { error: 'Shipping information is required' },
        { status: 400 }
      );
    }

    const { customerName, customerEmail, shippingAddress, shippingCity, shippingPostalCode, shippingCountry } = shippingInfo;

    if (!customerName || !customerEmail || !shippingAddress || !shippingCity || !shippingPostalCode || !shippingCountry) {
      return NextResponse.json(
        { error: 'All shipping fields are required' },
        { status: 400 }
      );
    }

    if (!customerEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
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
    const discount = product.discount || 0;
    const finalPrice = discount > 0 
      ? originalPrice * (1 - discount / 100)
      : originalPrice;

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
        discount: discount.toString(),
        finalPrice: finalPrice.toString(),
        gender: product.gender,
        category: product.category,
        // Shipping info
        customerName,
        customerEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingCountry,
      },
    });

    // Create a pending order in the database if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            product_id: product.id,
            stripe_session_id: session.id,
            status: 'pending',
            customer_name: customerName,
            customer_email: customerEmail,
            shipping_address: shippingAddress,
            shipping_city: shippingCity,
            shipping_postal_code: shippingPostalCode,
            shipping_country: shippingCountry,
            original_price: originalPrice,
            discount_applied: discount,
            final_price: finalPrice,
            product_title: product.title,
            product_size: product.size,
            product_image: product.images[0] || null,
          });

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

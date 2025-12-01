import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

// Webhook secret for verifying signatures
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session expired:', session.id);
        // Could update order status to cancelled if we created a pending order
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing completed checkout:', session.id);

  // Get metadata from session
  const productId = session.metadata?.productId;
  const productName = session.metadata?.productName || 'Unknown Product';
  const productSize = session.metadata?.size || 'N/A';
  const productImage = session.metadata?.productImage || null;
  const originalPrice = parseFloat(session.metadata?.originalPrice || '0');
  const discountApplied = parseInt(session.metadata?.discount || '0', 10);

  // Get customer details from session
  const customerDetails = session.customer_details;
  const shippingDetails = session.shipping_details || session.customer_details;

  if (!customerDetails?.email || !shippingDetails?.address) {
    console.error('Missing customer or shipping details in session');
    return;
  }

  try {
    const supabase = createServerClient();

    // Create the order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: productId || null,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string || null,
        status: 'paid',
        customer_name: customerDetails.name || 'Unknown',
        customer_email: customerDetails.email,
        shipping_address: [
          shippingDetails.address?.line1,
          shippingDetails.address?.line2,
        ].filter(Boolean).join(', '),
        shipping_city: shippingDetails.address?.city || '',
        shipping_postal_code: shippingDetails.address?.postal_code || '',
        shipping_country: shippingDetails.address?.country || '',
        original_price: originalPrice,
        discount_applied: discountApplied,
        final_price: (session.amount_total || 0) / 100, // Convert from cents
        product_title: productName,
        product_size: productSize,
        product_image: productImage,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return;
    }

    console.log('Order created:', order.id);

    // Mark the product as sold (if we have a product ID)
    if (productId) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ is_sold: true })
        .eq('id', productId);

      if (updateError) {
        console.error('Error marking product as sold:', updateError);
      } else {
        console.log('Product marked as sold:', productId);
      }
    }
  } catch (error) {
    console.error('Error processing checkout completion:', error);
  }
}

// Disable body parsing for webhooks (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};


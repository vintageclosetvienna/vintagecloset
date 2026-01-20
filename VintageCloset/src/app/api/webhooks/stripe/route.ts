import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check for Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe inside the handler
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
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

  // Get all data from metadata (we store everything there during checkout creation)
  const metadata = session.metadata || {};
  const productId = metadata.productId;
  const productName = metadata.productName || 'Unknown Product';
  const productSize = metadata.size || 'N/A';
  const productImage = metadata.productImage || null;
  const originalPrice = parseFloat(metadata.originalPrice || '0');
  const discountApplied = parseInt(metadata.productDiscount || '0', 10);
  
  // Delivery method and pickup code
  const deliveryMethod = metadata.deliveryMethod || 'shipping';
  const pickupCode = metadata.pickupCode || '';
  
  // Customer and shipping info from metadata
  const customerName = metadata.customerName || session.customer_details?.name || 'Unknown';
  const customerEmail = metadata.customerEmail || session.customer_details?.email || '';
  const shippingAddress = metadata.shippingAddress || '';
  const shippingCity = metadata.shippingCity || '';
  const shippingPostalCode = metadata.shippingPostalCode || '';
  const shippingCountry = metadata.shippingCountry || '';
  
  // Discount code info
  const discountCode = metadata.discountCode || null;
  const discountCodeAmount = parseFloat(metadata.discountCodeAmount || '0');

  if (!customerEmail) {
    console.error('Missing customer email in session');
    return;
  }

  try {
    const supabase = createServerClient();

    // First, update existing pending order to paid status (if exists)
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single();

    if (existingOrder && !findError) {
      // Update existing order
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string || null,
        } as never)
        .eq('id', (existingOrder as { id: string }).id);

      if (updateOrderError) {
        console.error('Error updating order to paid:', updateOrderError);
      } else {
        console.log('Order updated to paid:', (existingOrder as { id: string }).id);
      }
    } else {
      // Create new order if pending order doesn't exist
      const orderData = {
        product_id: productId || null,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string || null,
        status: 'paid',
        customer_name: customerName,
        customer_email: customerEmail,
        shipping_address: deliveryMethod === 'pickup' 
          ? `ABHOLUNG - Code: ${pickupCode}` 
          : shippingAddress,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostalCode,
        shipping_country: shippingCountry,
        original_price: originalPrice,
        discount_applied: discountApplied,
        discount_code: discountCode,
        discount_code_amount: discountCodeAmount,
        final_price: (session.amount_total || 0) / 100,
        product_title: productName,
        product_size: productSize,
        product_image: productImage,
      };
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData as never)
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
      } else {
        console.log('Order created:', (order as { id: string } | null)?.id);
      }
    }

    // Mark the product as sold (if we have a product ID)
    if (productId) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ is_sold: true } as never)
        .eq('id', productId);

      if (updateError) {
        console.error('Error marking product as sold:', updateError);
      } else {
        console.log('Product marked as sold:', productId);
      }
    }

    // Save pickup code to database if this is a pickup order
    if (deliveryMethod === 'pickup' && pickupCode) {
      const pickupCodeData = {
        code: pickupCode,
        order_id: existingOrder ? (existingOrder as { id: string }).id : null,
        product_id: productId || null,
        customer_email: customerEmail,
        customer_name: customerName,
        product_title: productName,
        product_size: productSize,
        active: true,
      };

      const { error: pickupCodeError } = await supabase
        .from('pickup_codes')
        .insert(pickupCodeData as never);

      if (pickupCodeError) {
        console.error('Error saving pickup code:', pickupCodeError);
      } else {
        console.log('Pickup code saved:', pickupCode);
      }
    }
  } catch (error) {
    console.error('Error processing checkout completion:', error);
  }
}


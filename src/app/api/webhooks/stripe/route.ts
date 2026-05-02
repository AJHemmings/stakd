import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '../../../../utils/supabase/server';
import { headers } from 'next/headers';
import { syncOrderToSheets } from '../../../../utils/google-sheets';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extract metadata and other info
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
    const stripeSessionId = session.id;
    const shippingAddress = (session as any).shipping_details?.address;
    
    // Get cart data from metadata
    const cartDataRaw = session.metadata?.cart_data;
    const cartItems = cartDataRaw ? JSON.parse(cartDataRaw) : [];

    const supabase = await createClient();

    // 1. Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: stripeSessionId,
        customer_name: customerName,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        total_amount: totalAmount,
        payment_status: session.payment_status,
        fulfillment_status: 'RECEIVED'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error inserting order:', orderError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 2. Insert order items
    if (cartItems.length > 0) {
      const itemsToInsert = cartItems.map((item: any) => ({
        order_id: order.id,
        product_name: item.name,
        base_name: item.base,
        quantity: item.q,
        unit_price: item.price || 0,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
      }
    }

    // 3. Sync to Google Sheets
    try {
      await syncOrderToSheets({
        orderId: order.id,
        customerName: customerName || 'Unknown',
        total: totalAmount,
        status: 'RECEIVED',
        items: cartItems.map((i: any) => ({ name: i.name, quantity: i.q, base: i.base }))
      });
    } catch (sheetError) {
      console.error('Failed to sync to Google Sheets:', sheetError);
    }

    console.log(`Order ${order.id} created successfully from Stripe session ${stripeSessionId}`);
  }

  return NextResponse.json({ received: true });
}

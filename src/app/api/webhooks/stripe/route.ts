import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '../../../../utils/supabase/admin';
import { headers } from 'next/headers';
import { syncOrderToSheets } from '../../../../utils/google-sheets';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
    const stripeSessionId = session.id;
    const sessionAny = session as any;
    const shippingAddress =
      sessionAny.shipping_details?.address ??
      sessionAny.collected_information?.shipping_details?.address ??
      null;

    const cartDataRaw = session.metadata?.cart_data;
    const cartItems = cartDataRaw ? JSON.parse(cartDataRaw) : [];
    const voucherCode = session.metadata?.voucher_code;
    const rewardId = session.metadata?.reward_id;
    const freeProductId = session.metadata?.free_product_id;

    const supabase = createAdminClient();

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
        fulfillment_status: 'RECEIVED',
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
      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) console.error('Error inserting order items:', itemsError);
    }

    // 2b. Insert free reward product (customer-chosen, £0)
    if (freeProductId) {
      const { data: freeProduct } = await supabase
        .from('products')
        .select('name')
        .eq('id', freeProductId)
        .single();
      if (freeProduct) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_name: freeProduct.name,
          base_name: 'Free Reward',
          quantity: 1,
          unit_price: 0,
        });
      }
    }

    // 3. Check loyalty milestones (every 5 orders = reward)
    if (customerEmail) {
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_email', customerEmail)
        .eq('payment_status', 'paid');

      if (orderCount && orderCount > 0) {
        // Find all milestones hit (multiples of 5 up to order count, max 50)
        const milestonesHit: number[] = [];
        for (let m = 5; m <= Math.min(orderCount, 50); m += 5) milestonesHit.push(m);

        if (milestonesHit.length > 0) {
          const { data: tiers } = await supabase
            .from('reward_tiers')
            .select('id, order_milestone')
            .in('order_milestone', milestonesHit)
            .eq('is_active', true);

          if (tiers && tiers.length > 0) {
            const { data: alreadyEarned } = await supabase
              .from('user_rewards')
              .select('tier_id')
              .eq('user_email', customerEmail);

            const earnedIds = new Set(alreadyEarned?.map((r) => r.tier_id) ?? []);
            const newUnlocks = tiers.filter((t) => !earnedIds.has(t.id));

            if (newUnlocks.length > 0) {
              await supabase.from('user_rewards').insert(
                newUnlocks.map((t) => ({ user_email: customerEmail, tier_id: t.id }))
              );
            }
          }
        }
      }

      // 4. Mark voucher used
      if (voucherCode) {
        const { data: vc } = await supabase
          .from('voucher_codes')
          .select('uses_count')
          .eq('code', voucherCode)
          .single();
        if (vc) {
          await supabase
            .from('voucher_codes')
            .update({ uses_count: vc.uses_count + 1 })
            .eq('code', voucherCode);
        }
      }

      // 5. Mark reward redeemed
      if (rewardId) {
        await supabase
          .from('user_rewards')
          .update({ is_redeemed: true, redeemed_at: new Date().toISOString() })
          .eq('id', rewardId);
      }
    }

    // 6. Sync to Google Sheets
    try {
      await syncOrderToSheets({
        orderId: order.id,
        customerName: customerName || 'Unknown',
        total: totalAmount,
        status: 'RECEIVED',
        items: cartItems.map((i: any) => ({ name: i.name, quantity: i.q, base: i.base })),
      });
    } catch (sheetError) {
      console.error('Failed to sync to Google Sheets:', sheetError);
    }

    console.log(`Order ${order.id} created from Stripe session ${stripeSessionId}`);
  }

  return NextResponse.json({ received: true });
}

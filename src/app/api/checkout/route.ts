import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '../../../utils/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-03-25.dahlia' as any,
});

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe secret key is not configured.' }, { status: 500 });
  }

  try {
    const { items, userEmail, voucherCode, rewardId, freeProductId } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const lineItems: any[] = items.map((item: any) => ({
      price_data: {
        currency: 'gbp',
        product_data: { name: `${item.name} (${item.baseName})` },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const cartSubtotalPence = items.reduce(
      (sum: number, i: any) => sum + Math.round(i.price * 100) * i.quantity,
      0
    );

    let freeDelivery = false;
    let discountLabel = '';
    const metadata: Record<string, string> = {
      cart_data: JSON.stringify(
        items.map((i: any) => ({ id: i.id, name: i.name, base: i.baseName, q: i.quantity, price: i.price }))
      ),
    };

    const supabase = createAdminClient();

    if (voucherCode) {
      const { data: voucher } = await supabase
        .from('voucher_codes')
        .select('*')
        .eq('code', voucherCode.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (voucher) {
        const discountPence =
          voucher.discount_type === 'percentage'
            ? Math.round((cartSubtotalPence * voucher.discount_value) / 100)
            : Math.min(Math.round(voucher.discount_value * 100), cartSubtotalPence);

        if (discountPence > 0) {
          lineItems.push({
            price_data: {
              currency: 'gbp',
              product_data: {
                name:
                  voucher.discount_type === 'percentage'
                    ? `Voucher: ${voucher.name} (${voucher.discount_value}% off)`
                    : `Voucher: ${voucher.name} (£${voucher.discount_value} off)`,
              },
              unit_amount: -discountPence,
            },
            quantity: 1,
          });
          discountLabel = voucher.code;
          metadata.voucher_code = voucher.code;
        }
      }
    } else if (rewardId) {
      const { data: reward } = await supabase
        .from('user_rewards')
        .select('*, reward_tiers(*)')
        .eq('id', rewardId)
        .eq('is_redeemed', false)
        .single();

      if (reward?.reward_tiers) {
        const tier = reward.reward_tiers as any;
        metadata.reward_id = rewardId;

        if (tier.reward_type === 'free_delivery') {
          freeDelivery = true;
          discountLabel = 'Free Delivery Reward';
        } else if (tier.reward_type === 'percent_10') {
          const discountPence = Math.round(cartSubtotalPence * 0.1);
          lineItems.push({
            price_data: {
              currency: 'gbp',
              product_data: { name: 'Reward: 10% Off' },
              unit_amount: -discountPence,
            },
            quantity: 1,
          });
          discountLabel = '10% Off Reward';
        } else if (tier.reward_type === 'percent_20') {
          const discountPence = Math.round(cartSubtotalPence * 0.2);
          lineItems.push({
            price_data: {
              currency: 'gbp',
              product_data: { name: 'Reward: 20% Off' },
              unit_amount: -discountPence,
            },
            quantity: 1,
          });
          discountLabel = '20% Off Reward';
        } else if (tier.reward_type === 'free_item' && freeProductId) {
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', freeProductId)
            .single();
          if (product) {
            lineItems.push({
              price_data: {
                currency: 'gbp',
                product_data: { name: `${product.name} (Free Reward)` },
                unit_amount: 0,
              },
              quantity: 1,
            });
            discountLabel = `Free ${product.name}`;
            metadata.free_product_id = freeProductId;
          }
        }
      }
    }

    const shippingOptions: any[] = freeDelivery
      ? [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 0, currency: 'gbp' },
              display_name: 'Free Delivery (Reward)',
            },
          },
        ]
      : [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 399, currency: 'gbp' },
              display_name: 'Standard Shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 3 },
                maximum: { unit: 'business_day', value: 5 },
              },
            },
          },
        ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      ...(userEmail ? { customer_email: userEmail } : {}),
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cart`,
      shipping_address_collection: { allowed_countries: ['GB'] },
      shipping_options: shippingOptions,
      metadata,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

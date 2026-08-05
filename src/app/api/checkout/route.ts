import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '../../../utils/supabase/admin';
import { createClient } from '../../../utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-03-25.dahlia' as any,
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QUANTITY_PER_LINE = 99;

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe secret key is not configured.' }, { status: 500 });
  }

  try {
    // Note: the request body also carries a userEmail field. It is deliberately
    // not read — identity comes from the session cookie below.
    const { items, voucherCode, rewardId, freeProductId } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Nothing with money attached is taken from the request. The browser supplies
    // only what it is allowed to choose — which product, which base label, how
    // many — and every price is read from the products table below.
    const requestedItems: { productId: string; baseName: string; quantity: number }[] = [];

    for (const item of items) {
      const productId = item?.productId;
      if (typeof productId !== 'string' || !UUID_PATTERN.test(productId)) {
        return NextResponse.json({ error: 'Cart contains an invalid product' }, { status: 400 });
      }

      const quantity = Number(item?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
        return NextResponse.json(
          { error: `Quantity must be a whole number between 1 and ${MAX_QUANTITY_PER_LINE}` },
          { status: 400 }
        );
      }

      // Decorative only — there is no bases table, so this cannot affect price.
      const baseName = typeof item?.baseName === 'string' ? item.baseName.slice(0, 80) : '';

      requestedItems.push({ productId, baseName, quantity });
    }

    const supabase = createAdminClient();

    // The signed-in identity, established server-side from the session cookie.
    // Null for guest checkout, which is allowed — guests just cannot use
    // rewards or one-per-customer codes.
    const authClient = await createClient();
    const { data: { user: sessionUser } } = await authClient.auth.getUser();
    const sessionEmail = sessionUser?.email?.toLowerCase() ?? null;

    const productIds = [...new Set(requestedItems.map((i) => i.productId))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    if (productsError) {
      console.error('Product lookup failed:', productsError);
      return NextResponse.json({ error: 'Could not verify cart contents' }, { status: 500 });
    }

    const productsById = new Map((products ?? []).map((p: any) => [p.id, p]));
    if (productsById.size !== productIds.length) {
      return NextResponse.json({ error: 'Cart contains an unavailable product' }, { status: 400 });
    }

    // Priced entirely from the database.
    const pricedItems = requestedItems.map((item) => {
      const product = productsById.get(item.productId) as any;
      const unitAmountPence = Math.round(Number(product.price) * 100);

      if (!Number.isFinite(unitAmountPence) || unitAmountPence < 0) {
        throw new Error(`Product ${product.id} has an invalid price`);
      }

      return {
        productId: item.productId,
        name: product.name,
        baseName: item.baseName,
        quantity: item.quantity,
        unitAmountPence,
      };
    });

    const lineItems: any[] = pricedItems.map((item) => ({
      price_data: {
        currency: 'gbp',
        product_data: { name: item.baseName ? `${item.name} (${item.baseName})` : item.name },
        unit_amount: item.unitAmountPence,
      },
      quantity: item.quantity,
    }));

    const cartSubtotalPence = pricedItems.reduce(
      (sum, i) => sum + i.unitAmountPence * i.quantity,
      0
    );

    let freeDelivery = false;
    let onePoundDelivery = false;
    let discountLabel = '';
    const metadata: Record<string, string> = {
      cart_data: JSON.stringify(
        pricedItems.map((i) => ({
          id: i.productId,
          name: i.name,
          base: i.baseName,
          q: i.quantity,
          price: i.unitAmountPence / 100,
        }))
      ),
    };

    if (voucherCode) {
      const { data: voucher } = await supabase
        .from('voucher_codes')
        .select('*')
        .eq('code', String(voucherCode).toUpperCase().trim())
        .eq('is_active', true)
        .single();

      // These are the same rules /api/vouchers/validate applies. That endpoint
      // is advisory — it tells the UI what to display. This is the one that
      // decides what the customer is charged, so it has to check them again.
      if (!voucher) {
        return NextResponse.json({ error: 'Invalid or inactive code' }, { status: 400 });
      }
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        return NextResponse.json({ error: 'This code has expired' }, { status: 400 });
      }
      if (voucher.max_uses !== null && voucher.uses_count >= voucher.max_uses) {
        return NextResponse.json({ error: 'This code has reached its usage limit' }, { status: 400 });
      }
      if (voucher.one_per_customer) {
        // Enforced against the session email, never the request body — a
        // client-supplied address would make the limit self-defeating.
        if (!sessionEmail) {
          return NextResponse.json(
            { error: 'Please sign in to use this code' },
            { status: 400 }
          );
        }
        const { data: priorRedemption } = await supabase
          .from('voucher_redemptions')
          .select('id')
          .eq('voucher_code_id', voucher.id)
          .eq('customer_email', sessionEmail)
          .maybeSingle();
        if (priorRedemption) {
          return NextResponse.json({ error: 'You have already used this code' }, { status: 400 });
        }
      }

      metadata.voucher_code = voucher.code;
      discountLabel = voucher.code;

      if (voucher.discount_type === 'free_delivery') {
        freeDelivery = true;
      } else if (voucher.discount_type === 'one_pound_delivery') {
        onePoundDelivery = true;
      } else {
        const discountValue = Number(voucher.discount_value);
        const discountPence =
          voucher.discount_type === 'percentage'
            ? Math.round((cartSubtotalPence * discountValue) / 100)
            : Math.min(Math.round(discountValue * 100), cartSubtotalPence);

        if (discountPence > 0) {
          lineItems.push({
            price_data: {
              currency: 'gbp',
              product_data: {
                name:
                  voucher.discount_type === 'percentage'
                    ? `Voucher: ${voucher.name} (${discountValue}% off)`
                    : `Voucher: ${voucher.name} (£${discountValue} off)`,
              },
              unit_amount: -discountPence,
            },
            quantity: 1,
          });
        }
      }
    } else if (rewardId) {
      // Rewards belong to an account, so redeeming one requires being signed in
      // as its owner. Matching on id alone would let anyone spend anyone's
      // reward just by guessing or reading an id.
      if (!sessionEmail) {
        return NextResponse.json({ error: 'Please sign in to use a reward' }, { status: 401 });
      }

      const { data: reward } = await supabase
        .from('user_rewards')
        .select('*, reward_tiers(*)')
        .eq('id', rewardId)
        .eq('is_redeemed', false)
        .ilike('user_email', sessionEmail)
        .single();

      if (!reward) {
        return NextResponse.json({ error: 'Reward is not available' }, { status: 400 });
      }

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

    // Determine shipping cost — voucher/reward overrides take precedence over tier logic
    let shippingAmount = 399;
    let shippingLabel = 'Standard Shipping';

    if (freeDelivery) {
      shippingAmount = 0;
      shippingLabel = 'Free Delivery';
    } else if (onePoundDelivery) {
      shippingAmount = 100;
      shippingLabel = '£1 Delivery';
    } else {
      const totalItems: number = pricedItems.reduce((sum, i) => sum + i.quantity, 0);
      const cartSubtotalGbp = cartSubtotalPence / 100;

      const [tiersResult, settingResult] = await Promise.all([
        supabase.from('shipping_tiers').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('store_settings').select('value').eq('key', 'free_delivery_threshold_gbp').single(),
      ]);

      const freeThreshold = parseFloat(settingResult.data?.value ?? '45');

      if (cartSubtotalGbp >= freeThreshold) {
        shippingAmount = 0;
        shippingLabel = 'Free Delivery';
      } else {
        const tier = (tiersResult.data ?? []).find((t: any) =>
          totalItems >= t.min_items && (t.max_items === null || totalItems <= t.max_items)
        );
        if (tier) {
          shippingAmount = tier.price_pence;
          shippingLabel = tier.label;
        }
      }
    }

    const shippingOptions: any[] = [{
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: shippingAmount, currency: 'gbp' },
        display_name: shippingLabel,
        ...(shippingAmount > 0 ? {
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 1 },
            maximum: { unit: 'business_day', value: 1 },
          },
        } : {}),
      },
    }];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      ...(sessionEmail ? { customer_email: sessionEmail } : {}),
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

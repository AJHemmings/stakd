import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';
import { requireAdmin } from '../../../../utils/auth/require-admin';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();

  const [ordersResult, tiersResult, userRewardsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('customer_email, customer_name')
      .eq('payment_status', 'paid')
      .not('customer_email', 'is', null),
    supabase
      .from('reward_tiers')
      .select('id, order_milestone, name, reward_type, is_active')
      .order('order_milestone'),
    supabase
      .from('user_rewards')
      .select('user_email, tier_id, is_redeemed'),
  ]);

  const orders = ordersResult.data ?? [];
  const tiers = tiersResult.data ?? [];
  const userRewards = userRewardsResult.data ?? [];

  // Aggregate order counts per customer
  const customerMap = new Map<string, { email: string; name: string | null; orderCount: number }>();
  for (const order of orders) {
    if (!order.customer_email) continue;
    if (!customerMap.has(order.customer_email)) {
      customerMap.set(order.customer_email, {
        email: order.customer_email,
        name: order.customer_name ?? null,
        orderCount: 0,
      });
    }
    customerMap.get(order.customer_email)!.orderCount++;
  }

  // Group rewards by user email
  const rewardsByEmail = new Map<string, typeof userRewards>();
  for (const r of userRewards) {
    if (!rewardsByEmail.has(r.user_email)) rewardsByEmail.set(r.user_email, []);
    rewardsByEmail.get(r.user_email)!.push(r);
  }

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.orderCount - a.orderCount)
    .map(customer => {
      const earned = rewardsByEmail.get(customer.email) ?? [];
      const earnedTierIds = new Set(earned.map(r => r.tier_id));
      const redeemedTierIds = new Set(earned.filter(r => r.is_redeemed).map(r => r.tier_id));

      const milestones = tiers.map(tier => ({
        order_milestone: tier.order_milestone,
        name: tier.name,
        reward_type: tier.reward_type,
        earned: earnedTierIds.has(tier.id),
        redeemed: redeemedTierIds.has(tier.id),
      }));

      const nextMilestone = tiers.find(t => t.order_milestone > customer.orderCount);

      return {
        email: customer.email,
        name: customer.name,
        orderCount: customer.orderCount,
        nextMilestone: nextMilestone?.order_milestone ?? null,
        milestones,
      };
    });

  return NextResponse.json(customers);
}

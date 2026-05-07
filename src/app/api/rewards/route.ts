import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { createAdminClient } from '../../../utils/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const [orderCountResult, availableRewardsResult, tiersResult] = await Promise.all([
    admin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('customer_email', user.email)
      .eq('payment_status', 'paid'),
    admin
      .from('user_rewards')
      .select('*, reward_tiers(*)')
      .eq('user_email', user.email)
      .eq('is_redeemed', false),
    admin
      .from('reward_tiers')
      .select('*, products(id, name)')
      .order('order_milestone'),
  ]);

  return NextResponse.json({
    orderCount: orderCountResult.count ?? 0,
    availableRewards: availableRewardsResult.data ?? [],
    tiers: tiersResult.data ?? [],
  });
}

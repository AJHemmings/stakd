import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { createAdminClient } from '../../../utils/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const [pointsResult, availableRewardsResult, tiersResult] = await Promise.all([
    admin.from('user_points').select('total_points').eq('user_email', user.email).single(),
    admin
      .from('user_rewards')
      .select('*, reward_tiers(*)')
      .eq('user_email', user.email)
      .eq('is_redeemed', false),
    admin.from('reward_tiers').select('*').eq('is_active', true).order('points_required'),
  ]);

  return NextResponse.json({
    totalPoints: pointsResult.data?.total_points ?? 0,
    availableRewards: availableRewardsResult.data ?? [],
    tiers: tiersResult.data ?? [],
  });
}

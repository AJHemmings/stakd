import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();

  const [tiersResult, settingResult] = await Promise.all([
    supabase.from('shipping_tiers').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('store_settings').select('value').eq('key', 'free_delivery_threshold_gbp').single(),
  ]);

  return NextResponse.json({
    tiers: tiersResult.data ?? [],
    freeThresholdGbp: parseFloat(settingResult.data?.value ?? '45'),
  });
}

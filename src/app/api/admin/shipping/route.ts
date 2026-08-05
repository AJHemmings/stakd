import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';
import { requireAdmin } from '../../../../utils/auth/require-admin';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();

  const [tiersResult, settingResult] = await Promise.all([
    supabase.from('shipping_tiers').select('*').order('sort_order'),
    supabase.from('store_settings').select('*').eq('key', 'free_delivery_threshold_gbp').single(),
  ]);

  return NextResponse.json({
    tiers: tiersResult.data ?? [],
    freeThresholdGbp: parseFloat(settingResult.data?.value ?? '45'),
  });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('shipping_tiers')
    .insert({
      label: body.label,
      min_items: body.min_items,
      max_items: body.max_items ?? null,
      price_pence: Math.round(parseFloat(body.price_gbp) * 100),
      sort_order: body.sort_order ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

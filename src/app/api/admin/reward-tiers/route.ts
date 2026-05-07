import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reward_tiers')
    .select('*, products(id, name)')
    .order('order_milestone');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reward_tiers')
    .insert({
      name: body.name,
      description: body.description || null,
      order_milestone: body.order_milestone,
      reward_type: body.reward_type,
      free_item_product_id: body.reward_type === 'free_item' ? (body.free_item_product_id || null) : null,
      sort_order: body.sort_order || 0,
      is_active: true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

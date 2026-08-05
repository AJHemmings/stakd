import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../utils/supabase/admin';
import { requireAdmin } from '../../../../../utils/auth/require-admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();

  const updates: Record<string, any> = {};
  if (body.label !== undefined) updates.label = body.label;
  if (body.min_items !== undefined) updates.min_items = body.min_items;
  if (body.max_items !== undefined) updates.max_items = body.max_items;
  if (body.price_gbp !== undefined) updates.price_pence = Math.round(parseFloat(body.price_gbp) * 100);
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const { data, error } = await supabase
    .from('shipping_tiers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from('shipping_tiers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

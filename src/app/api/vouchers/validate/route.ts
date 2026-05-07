import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';

export async function POST(req: NextRequest) {
  const { code, cartTotal } = await req.json();
  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('voucher_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Invalid or inactive code' }, { status: 404 });

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This code has expired' }, { status: 400 });
  }
  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return NextResponse.json({ error: 'This code has reached its usage limit' }, { status: 400 });
  }

  const discountAmount = data.discount_type === 'percentage'
    ? (cartTotal * data.discount_value) / 100
    : data.discount_value;

  return NextResponse.json({
    id: data.id,
    name: data.name,
    code: data.code,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    discountAmount: Math.min(discountAmount, cartTotal),
  });
}

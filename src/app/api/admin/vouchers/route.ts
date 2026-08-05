import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';
import { requireAdmin } from '../../../../utils/auth/require-admin';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('voucher_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('voucher_codes')
    .insert({
      code: body.code.toUpperCase().trim(),
      name: body.name,
      description: body.description || null,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      expires_at: body.expires_at || null,
      max_uses: body.max_uses || null,
      is_active: true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

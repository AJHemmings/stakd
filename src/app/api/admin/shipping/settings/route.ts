import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../utils/supabase/admin';

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('store_settings')
    .update({ value: String(body.value), updated_at: new Date().toISOString() })
    .eq('key', body.key);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

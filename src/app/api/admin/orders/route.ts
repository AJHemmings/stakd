import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  const { ids, batchId, updates } = await req.json();
  const supabase = createAdminClient();

  let query = supabase.from('orders').update(updates);

  if (ids?.length > 0) {
    query = query.in('id', ids);
  } else if (batchId) {
    query = query.eq('batch_id', batchId);
  } else {
    return NextResponse.json({ error: 'Must provide ids or batchId' }, { status: 400 });
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

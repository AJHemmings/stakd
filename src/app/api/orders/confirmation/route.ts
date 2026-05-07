import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('stripe_session_id', sessionId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json(data);
}

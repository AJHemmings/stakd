import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { createAdminClient } from '../../../utils/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('support_tickets')
    .select('*')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, orderReference, message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('support_tickets')
    .insert({
      order_id: orderId,
      order_reference: orderReference,
      customer_email: user.email,
      message: message.trim(),
      status: 'OPEN',
      unread_by_admin: true,
      unread_by_customer: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Seed the opening message into the thread
  await admin
    .from('support_messages')
    .insert({ ticket_id: data.id, author: 'customer', message: message.trim() });

  return NextResponse.json(data);
}

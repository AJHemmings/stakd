import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';
import { createAdminClient } from '../../../../utils/supabase/admin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify the ticket belongs to this user
  const { data: ticket, error: ticketError } = await admin
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .eq('customer_email', user.email)
    .single();

  if (ticketError || !ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [{ data: messages }] = await Promise.all([
    admin.from('support_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
    admin.from('support_tickets').update({ unread_by_customer: false }).eq('id', id),
  ]);

  return NextResponse.json({ ticket, messages: messages ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const admin = createAdminClient();

  // Verify ownership
  const { data: ticket } = await admin
    .from('support_tickets')
    .select('id')
    .eq('id', id)
    .eq('customer_email', user.email)
    .single();

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await admin
    .from('support_messages')
    .insert({ ticket_id: id, author: 'customer', message: message.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('support_tickets')
    .update({ unread_by_admin: true, unread_by_customer: false, status: 'OPEN' })
    .eq('id', id)
    .eq('status', 'RESOLVED');

  await admin.from('support_tickets')
    .update({ unread_by_admin: true, unread_by_customer: false })
    .eq('id', id)
    .neq('status', 'RESOLVED');

  return NextResponse.json(data);
}

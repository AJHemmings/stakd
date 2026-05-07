import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../utils/supabase/admin';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase.from('support_tickets').select('*').eq('id', id).single(),
    supabase.from('support_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
  ]);

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await supabase.from('support_tickets').update({ unread_by_admin: false }).eq('id', id);

  return NextResponse.json({ ticket, messages: messages ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('support_messages')
    .insert({ ticket_id: id, author: 'admin', message: message.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('support_tickets')
    .update({ status: 'IN_PROGRESS', unread_by_customer: true, unread_by_admin: false })
    .eq('id', id)
    .eq('status', 'OPEN');

  await supabase.from('support_tickets')
    .update({ unread_by_customer: true, unread_by_admin: false })
    .eq('id', id)
    .neq('status', 'OPEN');

  return NextResponse.json(data);
}

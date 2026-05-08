import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';
import { sendShippingUpdateEmail } from '../../../../utils/email';

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

  // If status is updated to OUT_FOR_DELIVERY, send shipping emails
  if (updates.fulfillment_status === 'OUT_FOR_DELIVERY') {
    try {
      // Fetch the updated orders to get customer emails and names
      let fetchQuery = supabase.from('orders').select('id, customer_name, customer_email, tracking_number');
      if (ids?.length > 0) fetchQuery = fetchQuery.in('id', ids);
      else if (batchId) fetchQuery = fetchQuery.eq('batch_id', batchId);
      
      const { data: updatedOrders } = await fetchQuery;

      if (updatedOrders) {
        for (const order of updatedOrders) {
          if (order.customer_email) {
            const orderRef = order.id.substring(0, 8).toUpperCase();
            await sendShippingUpdateEmail(
              order.customer_email,
              order.customer_name || 'Legend',
              orderRef,
              order.tracking_number || updates.tracking_number || 'STAKD-TRACK'
            ).catch(err => console.error(`Failed to send shipping email for ${order.id}:`, err));
          }
        }
      }
    } catch (e) {
      console.error('Error sending shipping updates:', e);
    }
  }

  return NextResponse.json({ success: true });
}

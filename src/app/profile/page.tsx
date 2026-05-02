import React from 'react';
import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '../../components/ui/Button';

// Utility for order status badges
const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  RECEIVED: { label: 'Order Received', color: '#e65100', bg: '#fff3e0' },
  PREPARING: { label: 'Preparing Ingredients', color: '#f57c00', bg: '#ffe0b2' },
  BAKED: { label: 'Baked & Ready', color: '#006064', bg: '#e0f7fa' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#1565c0', bg: '#e3f2fd' },
  DELIVERED: { label: 'Delivered', color: '#2e7d32', bg: '#e8f5e9' },
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    redirect('/login');
  }

  const user = authData.user;

  // Fetch orders linked to this user's email
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false });

  return (
    <div className="container" style={{ padding: '6rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--cream-dark)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)' }}>MY ACCOUNT</h1>
        <form action="/auth/signout" method="post">
          <Button variant="outline" type="submit">Sign Out</Button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
        {/* Left: Account Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--choc-mid)' }}>Details</h2>
            <div className="card" style={{ padding: '1.5rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>EMAIL</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{user.email}</p>
            </div>
          </div>
          
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--choc-mid)' }}>Support Tickets</h2>
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--grey)' }}>No active support tickets.</p>
            </div>
          </div>
        </div>

        {/* Right: Order History */}
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--choc-mid)' }}>Order History</h2>
          
          {ordersError && (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'red' }}>
              <p style={{ color: 'red' }}>Failed to load orders.</p>
            </div>
          )}

          {!ordersError && (!orders || orders.length === 0) ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--grey)', marginBottom: '1rem' }}>You haven't placed any orders yet.</p>
              <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Shop Now</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {orders?.map((order) => {
                const statusStyle = STATUS_STYLES[order.fulfillment_status] || { label: order.fulfillment_status, color: '#333', bg: '#eee' };
                const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                
                return (
                  <div key={order.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>ORDER {order.id.substring(0, 8).toUpperCase()}</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{date}</p>
                      </div>
                      <span style={{ 
                        background: statusStyle.bg, color: statusStyle.color, 
                        padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' 
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--cream-dark)', borderBottom: '1px solid var(--cream-dark)', padding: '1rem 0' }}>
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                          <span>{item.quantity}x {item.product_name} <span style={{ color: 'var(--grey)', fontSize: '0.85rem' }}>({item.base_name})</span></span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--grey)', fontSize: '0.9rem' }}>Total</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gold)' }}>£{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

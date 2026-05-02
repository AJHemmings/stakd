import React from 'react';
import { createClient } from '../../utils/supabase/server';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: dbOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  const orders = dbOrders || [];

  const totalSales = orders.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0;
  const totalOrders = orders.length || 0;

  // Simple aggregation for top product if we have many orders
  // For now, let's just keep a placeholder or do a quick check if possible
  // In a real app, we'd query order_items and count by product_name

  const recentOrders = orders.slice(0, 5) || [];

  return (
    <div>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>DASHBOARD</h1>
      <p style={{ color: 'var(--grey)', marginBottom: '3rem', fontFamily: 'var(--font-mono)' }}>Overview of STAK'D performance.</p>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>TOTAL SALES</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--choc-mid)' }}>£{totalSales.toFixed(2)}</p>
        </div>
        <div className="card" style={{ padding: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>ORDERS</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--choc-mid)' }}>{totalOrders}</p>
        </div>
        <div className="card" style={{ padding: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>TOP PRODUCT</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--choc-mid)', marginTop: '0.5rem' }}>Pistachio Cookie Dough</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Recent Orders Table */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Orders</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--cream-dark)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>
                <th style={{ padding: '1rem 0' }}>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                  <td style={{ padding: '1rem 0', fontFamily: 'var(--font-mono)' }}>#{order.id.substring(0, 5).toUpperCase()}</td>
                  <td>{order.customer_name}</td>
                  <td style={{ color: 'var(--grey)' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <span style={{ 
                      background: order.payment_status === 'paid' ? '#e8f5e9' : '#fff3e0', 
                      color: order.payment_status === 'paid' ? '#2e7d32' : '#ef6c00', 
                      padding: '0.2rem 0.6rem', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 600 
                    }}>
                      {order.payment_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>£{Number(order.total_amount).toFixed(2)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--grey)' }}>No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '2rem', background: 'var(--black)', color: 'var(--cream)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--gold)' }}>Quick Actions</h2>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>Add New Product</button>
          <button className="btn btn-outline" style={{ width: '100%' }}>Sync to Google Sheets</button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--white)' }}>
      {/* Admin Sidebar */}
      <aside style={{
        width: '250px',
        background: 'var(--black)',
        color: 'var(--cream)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '3rem', fontFamily: 'var(--font-bebas)', letterSpacing: '0.1em' }}>
          STAK'D ADMIN
        </h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
          <Link href="/admin" style={{ color: 'var(--cream-dark)' }}>Dashboard</Link>
          <Link href="/admin/orders" style={{ color: 'var(--cream-dark)' }}>Orders</Link>
          <Link href="/admin/products" style={{ color: 'var(--cream-dark)' }}>Products</Link>
          <Link href="/admin/insights" style={{ color: 'var(--cream-dark)' }}>Insights</Link>
          <Link href="/admin/support" style={{ color: 'var(--cream-dark)' }}>Support</Link>
          <Link href="/admin/vouchers" style={{ color: 'var(--cream-dark)' }}>Vouchers</Link>
          <Link href="/admin/rewards" style={{ color: 'var(--cream-dark)' }}>Rewards</Link>
        </nav>
        
        <div style={{ marginTop: 'auto' }}>
          <Link href="/" style={{ color: 'var(--grey)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>&larr; Back to Store</Link>
        </div>
      </aside>

      {/* Admin Content */}
      <main style={{ flex: 1, padding: '4rem', overflowY: 'auto', background: 'var(--cream)' }}>
        {children}
      </main>
    </div>
  );
}

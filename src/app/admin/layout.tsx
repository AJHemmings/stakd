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
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h2 className="admin-sidebar-title" style={{ color: 'var(--gold)', fontFamily: 'var(--font-bebas)', letterSpacing: '0.1em', fontSize: '2rem', marginBottom: '3rem' }}>
          STAK&apos;D ADMIN
        </h2>

        <nav className="admin-nav">
          <Link href="/admin" style={{ color: 'var(--cream-dark)' }}>Dashboard</Link>
          <Link href="/admin/orders" style={{ color: 'var(--cream-dark)' }}>Orders</Link>
          <Link href="/admin/products" style={{ color: 'var(--cream-dark)' }}>Products</Link>
          <Link href="/admin/insights" style={{ color: 'var(--cream-dark)' }}>Insights</Link>
          <Link href="/admin/support" style={{ color: 'var(--cream-dark)' }}>Support</Link>
          <Link href="/admin/vouchers" style={{ color: 'var(--cream-dark)' }}>Vouchers</Link>
          <Link href="/admin/rewards" style={{ color: 'var(--cream-dark)' }}>Rewards</Link>
          <Link href="/admin/loyalty" style={{ color: 'var(--cream-dark)' }}>Loyalty</Link>
          <Link href="/admin/shipping" style={{ color: 'var(--cream-dark)' }}>Shipping</Link>
        </nav>

        <div className="admin-sidebar-back" style={{ marginTop: 'auto' }}>
          <Link href="/" style={{ color: 'var(--grey)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>&larr; Back to Store</Link>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}

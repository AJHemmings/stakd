"use client";

import React, { useEffect, useState } from 'react';

interface Milestone {
  order_milestone: number;
  name: string;
  reward_type: string | null;
  earned: boolean;
  redeemed: boolean;
}

interface CustomerProgress {
  email: string;
  name: string | null;
  orderCount: number;
  nextMilestone: number | null;
  milestones: Milestone[];
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  free_delivery: 'Free Delivery',
  percent_10: '10% Off',
  percent_20: '20% Off',
  free_item: 'Free Item',
};

export default function AdminLoyaltyPage() {
  const [customers, setCustomers] = useState<CustomerProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/loyalty-progress')
      .then(r => r.json())
      .then(d => { setCustomers(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = customers.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalEarned = customers.reduce((sum, c) => sum + c.milestones.filter(m => m.earned).length, 0);
  const totalRedeemed = customers.reduce((sum, c) => sum + c.milestones.filter(m => m.redeemed).length, 0);

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Loyalty Progress</h1>
      <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '2.5rem' }}>
        Every customer who has placed a paid order. Milestones unlock every 5 orders.
      </p>

      {/* Stats row */}
      <div className="admin-3col-grid" style={{ marginBottom: '2.5rem' }}>
        {[
          { label: 'Customers', value: customers.length },
          { label: 'Milestones Earned', value: totalEarned },
          { label: 'Rewards Redeemed', value: totalRedeemed },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.2rem 1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--grey)', marginBottom: '0.4rem' }}>{s.label}</p>
            <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        style={{ width: '100%', maxWidth: '380px', padding: '0.6rem 0.9rem', border: '1px solid var(--cream-dark)', borderRadius: '3px', fontFamily: 'var(--font-outfit)', fontSize: '0.9rem', background: 'var(--white)', marginBottom: '1.5rem' }}
      />

      {loading ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>No customers found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(customer => {
            const progressInWindow = customer.orderCount % 5;
            const progressPct = customer.nextMilestone === null ? 100 : (progressInWindow / 5) * 100;
            const earnedCount = customer.milestones.filter(m => m.earned).length;

            return (
              <div
                key={customer.email}
                style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.2rem 1.5rem' }}
              >
                {/* Top row: name/email + order count */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
                  <div>
                    {customer.name && (
                      <p style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{customer.name}</p>
                    )}
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>{customer.email}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
                      {customer.orderCount}
                      <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--grey)', marginLeft: '0.3rem' }}>orders</span>
                    </p>
                    {earnedCount > 0 && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--choc-mid)' }}>
                        {earnedCount} milestone{earnedCount !== 1 ? 's' : ''} earned
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Progress
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--grey)' }}>
                      {customer.nextMilestone === null
                        ? 'Max reached (50 orders)'
                        : `${progressInWindow}/5 to milestone ${customer.nextMilestone}`}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--cream-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--gold)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* Milestone dots */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {customer.milestones.map(m => (
                    <div
                      key={m.order_milestone}
                      title={`${m.order_milestone} orders — ${m.name}${m.reward_type ? ` (${REWARD_TYPE_LABELS[m.reward_type] ?? m.reward_type})` : ''}${m.redeemed ? ' — Redeemed' : m.earned ? ' — Earned' : ''}`}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700,
                        background: m.redeemed ? 'var(--dark)' : m.earned ? 'var(--gold)' : 'var(--cream-dark)',
                        color: m.redeemed ? 'var(--gold)' : m.earned ? 'var(--dark)' : 'var(--grey)',
                        border: m.earned && !m.redeemed ? '2px solid var(--gold)' : '2px solid transparent',
                        cursor: 'default',
                        flexShrink: 0,
                      }}
                    >
                      {m.order_milestone}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        {[
          { bg: 'var(--cream-dark)', color: 'var(--grey)', border: 'transparent', label: 'Not reached' },
          { bg: 'var(--gold)', color: 'var(--dark)', border: 'var(--gold)', label: 'Earned (available)' },
          { bg: 'var(--dark)', color: 'var(--gold)', border: 'transparent', label: 'Redeemed' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: l.bg, border: `2px solid ${l.border}`, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--grey)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

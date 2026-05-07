"use client";

import React, { useEffect, useState } from 'react';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface DataPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface Product {
  name: string;
  quantity: number;
  revenue: number;
}

interface InsightsData {
  daily: DataPoint[];
  weekly: DataPoint[];
  monthly: DataPoint[];
  yearly: DataPoint[];
  products: Product[];
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  uniqueCustomers: number;
}

function BarChart({ data }: { data: DataPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 0.01);
  const showEvery = data.length > 20 ? Math.ceil(data.length / 10) : 1;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '220px', padding: '0 4px', position: 'relative' }}>
        {/* Y-axis grid lines */}
        {[0, 25, 50, 75, 100].map(pct => (
          <div key={pct} style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${pct}%`, borderTop: '1px solid rgba(0,0,0,0.06)',
            pointerEvents: 'none'
          }} />
        ))}

        {data.map((d, i) => {
          const heightPct = (d.revenue / maxRevenue) * 100;
          const isHovered = hovered === i;
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && (
                <div style={{
                  position: 'absolute', bottom: `calc(${heightPct}% + 8px)`,
                  background: 'var(--dark)', color: 'var(--cream)', padding: '6px 10px',
                  borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                  transform: 'translateX(-50%)', left: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  £{d.revenue.toFixed(2)}<br />
                  <span style={{ color: 'var(--grey)', fontSize: '0.7rem' }}>{d.orders} order{d.orders !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div style={{
                width: '100%',
                height: `${heightPct}%`,
                minHeight: d.revenue > 0 ? '3px' : '0',
                background: isHovered ? 'var(--choc-mid)' : 'var(--gold)',
                borderRadius: '2px 2px 0 0',
                transition: 'background 0.15s',
              }} />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div style={{ display: 'flex', gap: '3px', marginTop: '6px', padding: '0 4px' }}>
        {data.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontSize: '0.65rem', color: 'var(--grey)', fontFamily: 'var(--font-mono)',
            overflow: 'hidden', whiteSpace: 'nowrap',
            visibility: i % showEvery === 0 ? 'visible' : 'hidden'
          }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--grey)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--choc-mid)', lineHeight: 1.2 }}>{value}</p>
      {sub && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)', marginTop: '0.3rem' }}>{sub}</p>}
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/insights')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartData = data?.[period] ?? [];
  const top = data?.products[0];
  const bottom = data?.products[data.products.length - 1];
  const topRevenue = [...(data?.products ?? [])].sort((a, b) => b.revenue - a.revenue)[0];

  const PERIOD_LABELS: Record<Period, string> = {
    daily: 'Last 30 Days',
    weekly: 'Last 12 Weeks',
    monthly: 'Last 12 Months',
    yearly: 'All Years',
  };

  return (
    <div>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>INSIGHTS</h1>
      <p style={{ color: 'var(--grey)', marginBottom: '3rem', fontFamily: 'var(--font-mono)' }}>Sales analytics and product performance.</p>

      {loading ? (
        <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>Loading...</p>
      ) : !data ? (
        <p style={{ color: 'red' }}>Failed to load insights.</p>
      ) : (
        <>
          {/* Top KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
            <InsightCard label="Total Revenue" value={`£${data.totalRevenue.toFixed(2)}`} />
            <InsightCard label="Total Orders" value={String(data.totalOrders)} />
            <InsightCard label="Avg Order Value" value={`£${data.avgOrderValue.toFixed(2)}`} />
            <InsightCard label="Unique Customers" value={String(data.uniqueCustomers)} />
          </div>

          {/* Bar chart */}
          <div className="card" style={{ padding: '2rem', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Revenue — {PERIOD_LABELS[period]}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '0.4rem 0.9rem',
                      fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                      fontWeight: period === p ? 700 : 400,
                      background: period === p ? 'var(--dark)' : 'transparent',
                      color: period === p ? 'var(--gold)' : 'var(--grey)',
                      border: '1px solid',
                      borderColor: period === p ? 'var(--dark)' : 'var(--cream-dark)',
                      borderRadius: '2px', cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <BarChart data={chartData} />
          </div>

          {/* Product insights */}
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Product Performance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
            <InsightCard
              label="Top by Volume"
              value={top?.name ?? 'No data'}
              sub={top ? `${top.quantity} units sold` : undefined}
            />
            <InsightCard
              label="Top by Revenue"
              value={topRevenue?.name ?? 'No data'}
              sub={topRevenue ? `£${topRevenue.revenue.toFixed(2)} earned` : undefined}
            />
            <InsightCard
              label="Least Ordered"
              value={bottom && bottom !== top ? bottom.name : (data.products.length <= 1 ? 'Need more data' : bottom?.name ?? 'No data')}
              sub={bottom && bottom !== top ? `${bottom.quantity} unit${bottom.quantity !== 1 ? 's' : ''} sold` : undefined}
            />
          </div>

          {/* Full product table */}
          {data.products.length > 0 && (
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>All Products</h2>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--cream-dark)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>
                    <th style={{ padding: '0.75rem 0' }}>PRODUCT</th>
                    <th>UNITS SOLD</th>
                    <th>REVENUE</th>
                    <th>AVG UNIT PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map(p => (
                    <tr key={p.name} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{p.quantity}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>£{p.revenue.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--grey)' }}>£{(p.revenue / p.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

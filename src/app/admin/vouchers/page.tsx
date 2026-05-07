"use client";

import React, { useEffect, useState } from 'react';

type DiscountType = 'percentage' | 'fixed' | 'free_delivery' | 'one_pound_delivery';

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed £',
  free_delivery: 'Free Delivery',
  one_pound_delivery: '£1 Delivery',
};

const DISCOUNT_TYPE_COLORS: Record<DiscountType, { bg: string; color: string }> = {
  percentage: { bg: '#e3f2fd', color: '#1565c0' },
  fixed: { bg: '#f3e5f5', color: '#6a1b9a' },
  free_delivery: { bg: '#e8f5e9', color: '#2e7d32' },
  one_pound_delivery: { bg: '#fff8e1', color: '#e65100' },
};

function discountSummary(v: Voucher): string {
  if (v.discount_type === 'percentage') return `${v.discount_value}% off`;
  if (v.discount_type === 'fixed') return `£${v.discount_value} off`;
  if (v.discount_type === 'free_delivery') return 'Delivery free';
  if (v.discount_type === 'one_pound_delivery') return 'Delivery £1';
  return '—';
}

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  one_per_customer: boolean;
  is_active: boolean;
  created_at: string;
}

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--grey)',
  display: 'block',
  marginBottom: '0.4rem',
};

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '1px solid var(--cream-dark)',
  borderRadius: '3px',
  fontFamily: 'var(--font-outfit)',
  fontSize: '0.95rem',
  background: 'var(--white)',
  color: 'var(--dark)',
};

const emptyForm = {
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage' as DiscountType,
  discount_value: '',
  expires_at: '',
  max_uses: '',
  one_per_customer: false,
};

const DELIVERY_TYPES: DiscountType[] = ['free_delivery', 'one_pound_delivery'];

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isDeliveryType = DELIVERY_TYPES.includes(form.discount_type);

  const load = async () => {
    const res = await fetch('/api/admin/vouchers');
    if (res.ok) setVouchers(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.code || !form.name) {
      setError('Code and name are required.');
      return;
    }
    if (!isDeliveryType && !form.discount_value) {
      setError('Discount value is required for this type.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        discount_value: isDeliveryType ? 0 : parseFloat(form.discount_value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setForm(emptyForm);
      load();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to create voucher');
    }
  };

  const toggleActive = async (v: Voucher) => {
    await fetch(`/api/admin/vouchers/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !v.is_active }),
    });
    load();
  };

  const deleteVoucher = async (id: string) => {
    if (!confirm('Delete this voucher code?')) return;
    await fetch(`/api/admin/vouchers/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Voucher Codes</h1>
      <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '3rem' }}>
        Create discount codes for customers to apply at checkout.
      </p>

      {/* Create form */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Create New Code</h2>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={LABEL}>Code</label>
              <input style={INPUT} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" />
            </div>
            <div>
              <label style={LABEL}>Name (internal)</label>
              <input style={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Summer 2026 Promo" />
            </div>
            <div>
              <label style={LABEL}>Description</label>
              <input style={INPUT} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isDeliveryType ? '1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={LABEL}>Type</label>
              <select
                style={INPUT}
                value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as DiscountType, discount_value: '' }))}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (£)</option>
                <option value="free_delivery">Free Delivery</option>
                <option value="one_pound_delivery">£1 Delivery</option>
              </select>
            </div>
            {!isDeliveryType && (
              <div>
                <label style={LABEL}>Value</label>
                <input
                  style={INPUT}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === 'percentage' ? '20' : '5.00'}
                />
              </div>
            )}
            <div>
              <label style={LABEL}>Expires (optional)</label>
              <input style={INPUT} type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div>
              <label style={LABEL}>Max Uses (optional)</label>
              <input style={INPUT} type="number" min="1" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              checked={form.one_per_customer}
              onChange={e => setForm(f => ({ ...f, one_per_customer: e.target.checked }))}
            />
            One use per customer (each email can only redeem this code once)
          </label>

          {error && <p style={{ color: 'red', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Creating...' : 'Create Voucher'}
          </button>
        </form>
      </div>

      {/* Voucher list */}
      {loading ? (
        <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>Loading...</p>
      ) : vouchers.length === 0 ? (
        <p style={{ color: 'var(--grey)' }}>No voucher codes yet.</p>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--cream-dark)' }}>
                {['Code', 'Name', 'Type', 'Discount', 'Uses', 'Expires', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--grey)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v, i) => {
                const typeStyle = DISCOUNT_TYPE_COLORS[v.discount_type] ?? { bg: '#fafafa', color: 'var(--grey)' };
                return (
                  <tr key={v.id} style={{ borderBottom: i < vouchers.length - 1 ? '1px solid var(--cream-dark)' : 'none' }}>
                    <td style={{ padding: '0.9rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem' }}>{v.code}</td>
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.9rem' }}>{v.name}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: typeStyle.bg, color: typeStyle.color }}>
                        {DISCOUNT_TYPE_LABELS[v.discount_type] ?? v.discount_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {discountSummary(v)}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>
                      {v.uses_count}{v.max_uses ? ` / ${v.max_uses}` : ''}
                      {v.one_per_customer && (
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--choc-mid)', marginTop: '0.15rem' }}>1 per customer</span>
                      )}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: 'var(--grey)' }}>
                      {v.expires_at ? new Date(v.expires_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700, background: v.is_active ? '#e8f5e9' : '#fafafa', color: v.is_active ? '#2e7d32' : 'var(--grey)' }}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => toggleActive(v)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.3rem 0.7rem', border: '1px solid var(--cream-dark)', borderRadius: '3px', background: 'transparent', cursor: 'pointer' }}>
                          {v.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => deleteVoucher(v.id)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.3rem 0.7rem', border: '1px solid #ffcdd2', borderRadius: '3px', background: 'transparent', color: '#c62828', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

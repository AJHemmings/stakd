"use client";

import React, { useEffect, useState } from 'react';

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
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
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  expires_at: '',
  max_uses: '',
};

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/vouchers');
    if (res.ok) setVouchers(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.code || !form.name || !form.discount_value) {
      setError('Code, name and discount value are required.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        discount_value: parseFloat(form.discount_value),
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={LABEL}>Type</label>
              <select style={INPUT} value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (£)</option>
              </select>
            </div>
            <div>
              <label style={LABEL}>Value</label>
              <input style={INPUT} type="number" min="0" step="0.01" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder={form.discount_type === 'percentage' ? '20' : '5.00'} />
            </div>
            <div>
              <label style={LABEL}>Expires (optional)</label>
              <input style={INPUT} type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div>
              <label style={LABEL}>Max Uses (optional)</label>
              <input style={INPUT} type="number" min="1" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" />
            </div>
          </div>
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
                {['Code', 'Name', 'Discount', 'Uses', 'Expires', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--grey)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v, i) => (
                <tr key={v.id} style={{ borderBottom: i < vouchers.length - 1 ? '1px solid var(--cream-dark)' : 'none' }}>
                  <td style={{ padding: '0.9rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem' }}>{v.code}</td>
                  <td style={{ padding: '0.9rem 1rem', fontSize: '0.9rem' }}>{v.name}</td>
                  <td style={{ padding: '0.9rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    {v.discount_type === 'percentage' ? `${v.discount_value}%` : `£${v.discount_value}`}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>
                    {v.uses_count}{v.max_uses ? ` / ${v.max_uses}` : ''}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: 'var(--grey)' }}>
                    {v.expires_at ? new Date(v.expires_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700,
                      background: v.is_active ? '#e8f5e9' : '#fafafa',
                      color: v.is_active ? '#2e7d32' : 'var(--grey)',
                    }}>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

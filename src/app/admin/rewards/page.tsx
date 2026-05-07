"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '../../../utils/supabase/client';

interface RewardTier {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: 'free_delivery' | 'percent_10' | 'percent_20' | 'free_item';
  free_item_product_id: string | null;
  is_active: boolean;
  products?: { id: string; name: string } | null;
}

interface Product {
  id: string;
  name: string;
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  free_delivery: 'Free Delivery',
  percent_10: '10% Off',
  percent_20: '20% Off',
  free_item: 'Free Item',
};

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
  name: '',
  description: '',
  points_required: '',
  reward_type: 'free_delivery' as RewardTier['reward_type'],
  free_item_product_id: '',
};

export default function AdminRewardsPage() {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const supabase = createClient();
    const [tiersRes, { data: productsData }] = await Promise.all([
      fetch('/api/admin/reward-tiers'),
      supabase.from('products').select('id, name').order('name'),
    ]);
    if (tiersRes.ok) setTiers(await tiersRes.json());
    if (productsData) setProducts(productsData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.points_required) {
      setError('Name and points required are required.');
      return;
    }
    if (form.reward_type === 'free_item' && !form.free_item_product_id) {
      setError('Please select a product for the free item reward.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/reward-tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        points_required: parseInt(form.points_required),
        free_item_product_id: form.reward_type === 'free_item' ? form.free_item_product_id : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setForm(emptyForm);
      load();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to create tier');
    }
  };

  const toggleActive = async (tier: RewardTier) => {
    await fetch(`/api/admin/reward-tiers/${tier.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !tier.is_active }),
    });
    load();
  };

  const deleteTier = async (id: string) => {
    if (!confirm('Delete this reward tier?')) return;
    await fetch(`/api/admin/reward-tiers/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Reward Tiers</h1>
      <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        Customers earn 1 point per £1 spent. When they hit a milestone, the reward is unlocked automatically.
      </p>
      <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '3rem' }}>
        Rewards cannot be stacked with voucher codes.
      </p>

      {/* Create form */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '2rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Add Reward Tier</h2>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={LABEL}>Name</label>
              <input style={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bronze Reward" />
            </div>
            <div>
              <label style={LABEL}>Description</label>
              <input style={INPUT} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional customer-facing description" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={LABEL}>Points Required</label>
              <input style={INPUT} type="number" min="1" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: e.target.value }))} placeholder="50" />
            </div>
            <div>
              <label style={LABEL}>Reward Type</label>
              <select style={INPUT} value={form.reward_type} onChange={e => setForm(f => ({ ...f, reward_type: e.target.value as any, free_item_product_id: '' }))}>
                <option value="free_delivery">Free Delivery</option>
                <option value="percent_10">10% Off</option>
                <option value="percent_20">20% Off</option>
                <option value="free_item">Free Item</option>
              </select>
            </div>
            {form.reward_type === 'free_item' && (
              <div>
                <label style={LABEL}>Free Product</label>
                <select style={INPUT} value={form.free_item_product_id} onChange={e => setForm(f => ({ ...f, free_item_product_id: e.target.value }))}>
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {error && <p style={{ color: 'red', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Add Tier'}
          </button>
        </form>
      </div>

      {/* Tier list */}
      {loading ? (
        <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>Loading...</p>
      ) : tiers.length === 0 ? (
        <p style={{ color: 'var(--grey)' }}>No reward tiers yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tiers.map(tier => (
            <div key={tier.id} style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', opacity: tier.is_active ? 1 : 0.55 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{tier.points_required}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>pts</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{tier.name}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--choc-mid)' }}>
                    {REWARD_TYPE_LABELS[tier.reward_type]}
                    {tier.reward_type === 'free_item' && tier.products && ` — ${tier.products.name}`}
                  </p>
                  {tier.description && <p style={{ fontSize: '0.85rem', color: 'var(--grey)', marginTop: '0.2rem' }}>{tier.description}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700,
                  background: tier.is_active ? '#e8f5e9' : '#fafafa',
                  color: tier.is_active ? '#2e7d32' : 'var(--grey)',
                }}>
                  {tier.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => toggleActive(tier)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.3rem 0.7rem', border: '1px solid var(--cream-dark)', borderRadius: '3px', background: 'transparent', cursor: 'pointer' }}>
                  {tier.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteTier(tier.id)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.3rem 0.7rem', border: '1px solid #ffcdd2', borderRadius: '3px', background: 'transparent', color: '#c62828', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

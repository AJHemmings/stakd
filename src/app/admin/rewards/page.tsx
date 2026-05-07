"use client";

import React, { useEffect, useState } from 'react';

interface RewardTier {
  id: string;
  name: string;
  description: string | null;
  order_milestone: number;
  reward_type: string | null;
  free_item_product_id: string | null;
  is_active: boolean;
  products?: { id: string; name: string } | null;
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
  padding: '0.6rem 0.8rem',
  border: '1px solid var(--cream-dark)',
  borderRadius: '3px',
  fontFamily: 'var(--font-outfit)',
  fontSize: '0.9rem',
  background: 'var(--white)',
  color: 'var(--dark)',
};

const MILESTONES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export default function AdminRewardsPage() {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    reward_type: '',
    free_item_product_id: '',
    is_active: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const tiersRes = await fetch('/api/admin/reward-tiers');
      if (tiersRes.ok) {
        const data = await tiersRes.json();
        setTiers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load reward tiers:', e);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (tier: RewardTier) => {
    setEditingId(tier.id);
    setEditForm({
      name: tier.name,
      description: tier.description || '',
      reward_type: tier.reward_type || '',
      free_item_product_id: tier.free_item_product_id || '',
      is_active: tier.is_active,
    });
    setError('');
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/reward-tiers/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description || null,
        reward_type: editForm.reward_type || null,
        free_item_product_id:
          editForm.reward_type === 'free_item' ? (editForm.free_item_product_id || null) : null,
        is_active: editForm.is_active,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      load();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to save');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Reward Milestones</h1>
      <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '3rem' }}>
        A reward unlocks every 5 orders. There are 10 milestones — configure what each one gives.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {MILESTONES.map(milestone => {
          const tier = tiers.find(t => t.order_milestone === milestone);
          const isEditing = tier && editingId === tier.id;

          return (
            <div
              key={milestone}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--cream-dark)',
                borderRadius: '4px',
                overflow: 'hidden',
                opacity: tier && !tier.is_active ? 0.65 : 1,
              }}
            >
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '1.2rem 1.5rem', gap: '1.5rem' }}>
                {/* Circle */}
                <div style={{ textAlign: 'center', flexShrink: 0, width: 52 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', margin: '0 auto',
                    background: tier?.is_active ? 'var(--gold)' : 'var(--cream-dark)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem',
                    color: tier?.is_active ? 'var(--dark)' : 'var(--grey)',
                  }}>
                    {milestone}
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.3rem' }}>
                    orders
                  </p>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  {tier ? (
                    <>
                      <p style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{tier.name}</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: tier.reward_type ? 'var(--choc-mid)' : 'var(--grey)' }}>
                        {tier.reward_type
                          ? REWARD_TYPE_LABELS[tier.reward_type]
                          : 'No reward type set'}
                        {tier.reward_type === 'free_item' && tier.products && ` — ${tier.products.name}`}
                      </p>
                    </>
                  ) : (
                    <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Not loaded</p>
                  )}
                </div>

                {/* Status + edit button */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                  {tier && (
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 700,
                      background: tier.is_active ? '#e8f5e9' : '#fafafa',
                      color: tier.is_active ? '#2e7d32' : 'var(--grey)',
                    }}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                  {tier && (
                    <button
                      onClick={() => isEditing ? setEditingId(null) : openEdit(tier)}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.35rem 0.8rem',
                        border: '1px solid var(--cream-dark)', borderRadius: '3px',
                        background: isEditing ? 'var(--dark)' : 'transparent',
                        color: isEditing ? 'var(--gold)' : 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <div style={{ padding: '1.5rem', background: 'var(--cream)', borderTop: '1px solid var(--cream-dark)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={LABEL}>Label</label>
                      <input
                        style={INPUT}
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        placeholder={`Milestone ${milestone}`}
                      />
                    </div>
                    <div>
                      <label style={LABEL}>Reward Type</label>
                      <select
                        style={INPUT}
                        value={editForm.reward_type}
                        onChange={e => setEditForm(f => ({ ...f, reward_type: e.target.value, free_item_product_id: '' }))}
                      >
                        <option value="">Select type...</option>
                        <option value="free_delivery">Free Delivery</option>
                        <option value="percent_10">10% Off</option>
                        <option value="percent_20">20% Off</option>
                        <option value="free_item">Free Item</option>
                      </select>
                    </div>
                  </div>
                  {editForm.reward_type === 'free_item' && (
                    <div style={{ marginBottom: '1rem', padding: '0.8rem 1rem', background: 'var(--cream)', border: '1px solid var(--cream-dark)', borderRadius: '3px' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--grey)' }}>
                        Customer selects their free product at checkout.
                      </p>
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                    />
                    Active (visible to customers)
                  </label>
                  {error && <p style={{ color: 'red', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ opacity: saving ? 0.6 : 1, padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ padding: '0.6rem 1.2rem', border: '1px solid var(--cream-dark)', borderRadius: '2px', background: 'transparent', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

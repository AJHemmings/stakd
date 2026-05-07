"use client";

import React, { useEffect, useState } from 'react';

interface ShippingTier {
  id: string;
  label: string;
  min_items: number;
  max_items: number | null;
  price_pence: number;
  sort_order: number;
  is_active: boolean;
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
  padding: '0.6rem 0.8rem',
  border: '1px solid var(--cream-dark)',
  borderRadius: '3px',
  fontFamily: 'var(--font-outfit)',
  fontSize: '0.9rem',
  background: 'var(--white)',
  color: 'var(--dark)',
};

const emptyForm = { label: '', min_items: '', max_items: '', price_gbp: '' };

export default function AdminShippingPage() {
  const [tiers, setTiers] = useState<ShippingTier[]>([]);
  const [freeThreshold, setFreeThreshold] = useState('45');
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState('45');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: '', min_items: '', max_items: '', price_gbp: '' });
  const [addForm, setAddForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/shipping');
    if (res.ok) {
      const d = await res.json();
      setTiers(d.tiers ?? []);
      setFreeThreshold(String(d.freeThresholdGbp));
      setThresholdInput(String(d.freeThresholdGbp));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveThreshold = async () => {
    const val = parseFloat(thresholdInput);
    if (isNaN(val) || val < 0) return;
    await fetch('/api/admin/shipping/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'free_delivery_threshold_gbp', value: val }),
    });
    setFreeThreshold(thresholdInput);
    setEditingThreshold(false);
  };

  const openEdit = (tier: ShippingTier) => {
    setEditingId(tier.id);
    setEditForm({
      label: tier.label,
      min_items: String(tier.min_items),
      max_items: tier.max_items !== null ? String(tier.max_items) : '',
      price_gbp: (tier.price_pence / 100).toFixed(2),
    });
    setError('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/shipping/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: editForm.label,
        min_items: parseInt(editForm.min_items),
        max_items: editForm.max_items ? parseInt(editForm.max_items) : null,
        price_gbp: editForm.price_gbp,
      }),
    });
    setSaving(false);
    if (res.ok) { setEditingId(null); load(); }
    else { const d = await res.json(); setError(d.error || 'Failed to save'); }
  };

  const deleteTier = async (id: string) => {
    if (!confirm('Delete this shipping tier?')) return;
    await fetch(`/api/admin/shipping/${id}`, { method: 'DELETE' });
    load();
  };

  const addTier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!addForm.label || !addForm.min_items || !addForm.price_gbp) {
      setError('Label, minimum items, and price are required.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: addForm.label,
        min_items: parseInt(addForm.min_items),
        max_items: addForm.max_items ? parseInt(addForm.max_items) : null,
        price_gbp: addForm.price_gbp,
        sort_order: tiers.length + 1,
      }),
    });
    setSaving(false);
    if (res.ok) { setAddForm(emptyForm); load(); }
    else { const d = await res.json(); setError(d.error || 'Failed to add tier'); }
  };

  const itemRangeLabel = (t: ShippingTier) =>
    t.max_items === null ? `${t.min_items}+` : t.min_items === t.max_items ? `${t.min_items}` : `${t.min_items}–${t.max_items}`;

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Shipping</h1>
      <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '3rem' }}>
        Shipping cost is calculated by total item count in the order. Voucher and reward overrides take precedence.
      </p>

      {/* Free delivery threshold */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Free delivery threshold</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>
              Orders at or above this value get free delivery automatically.
            </p>
          </div>
          {editingThreshold ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>£</span>
              <input
                style={{ ...INPUT, width: '80px' }}
                type="number"
                min="0"
                step="1"
                value={thresholdInput}
                onChange={e => setThresholdInput(e.target.value)}
              />
              <button onClick={saveThreshold} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Save</button>
              <button onClick={() => { setEditingThreshold(false); setThresholdInput(freeThreshold); }} style={{ padding: '0.5rem 0.8rem', border: '1px solid var(--cream-dark)', borderRadius: '3px', background: 'transparent', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.3rem' }}>£{freeThreshold}</span>
              <button onClick={() => setEditingThreshold(true)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.35rem 0.8rem', border: '1px solid var(--cream-dark)', borderRadius: '3px', background: 'transparent', cursor: 'pointer' }}>Edit</button>
            </div>
          )}
        </div>
      </div>

      {/* Tiers list */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Delivery Bands</h2>
      {loading ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {tiers.map(tier => (
            <div key={tier.id} style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', gap: '1.5rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--cream)', border: '1px solid var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--choc-mid)', textAlign: 'center', lineHeight: 1.2 }}>
                  {itemRangeLabel(tier)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.1rem' }}>{tier.label}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--grey)' }}>
                    {itemRangeLabel(tier)} item{tier.max_items !== 1 ? 's' : ''}
                  </p>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                  £{(tier.price_pence / 100).toFixed(2)}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => editingId === tier.id ? setEditingId(null) : openEdit(tier)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.3rem 0.7rem', border: '1px solid var(--cream-dark)', borderRadius: '3px', background: editingId === tier.id ? 'var(--dark)' : 'transparent', color: editingId === tier.id ? 'var(--gold)' : 'inherit', cursor: 'pointer' }}>
                    {editingId === tier.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button onClick={() => deleteTier(tier.id)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.3rem 0.7rem', border: '1px solid #ffcdd2', borderRadius: '3px', background: 'transparent', color: '#c62828', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>

              {editingId === tier.id && (
                <div style={{ padding: '1.25rem', background: 'var(--cream)', borderTop: '1px solid var(--cream-dark)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={LABEL}>Label</label>
                      <input style={INPUT} value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))} />
                    </div>
                    <div>
                      <label style={LABEL}>Min Items</label>
                      <input style={INPUT} type="number" min="1" value={editForm.min_items} onChange={e => setEditForm(f => ({ ...f, min_items: e.target.value }))} />
                    </div>
                    <div>
                      <label style={LABEL}>Max Items</label>
                      <input style={INPUT} type="number" min="1" value={editForm.max_items} onChange={e => setEditForm(f => ({ ...f, max_items: e.target.value }))} placeholder="No limit" />
                    </div>
                    <div>
                      <label style={LABEL}>Price (£)</label>
                      <input style={INPUT} type="number" min="0" step="0.01" value={editForm.price_gbp} onChange={e => setEditForm(f => ({ ...f, price_gbp: e.target.value }))} />
                    </div>
                  </div>
                  {error && <p style={{ color: 'red', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>}
                  <button onClick={saveEdit} disabled={saving} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', opacity: saving ? 0.6 : 1 }}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add tier form */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Add Band</h2>
        <form onSubmit={addTier}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={LABEL}>Label</label>
              <input style={INPUT} value={addForm.label} onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))} placeholder="Standard (1 item)" />
            </div>
            <div>
              <label style={LABEL}>Min Items</label>
              <input style={INPUT} type="number" min="1" value={addForm.min_items} onChange={e => setAddForm(f => ({ ...f, min_items: e.target.value }))} placeholder="1" />
            </div>
            <div>
              <label style={LABEL}>Max Items</label>
              <input style={INPUT} type="number" min="1" value={addForm.max_items} onChange={e => setAddForm(f => ({ ...f, max_items: e.target.value }))} placeholder="No limit" />
            </div>
            <div>
              <label style={LABEL}>Price (£)</label>
              <input style={INPUT} type="number" min="0" step="0.01" value={addForm.price_gbp} onChange={e => setAddForm(f => ({ ...f, price_gbp: e.target.value }))} placeholder="3.99" />
            </div>
          </div>
          {error && <p style={{ color: 'red', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Adding...' : 'Add Band'}
          </button>
        </form>
      </div>
    </div>
  );
}

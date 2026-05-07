"use client";

import React, { useEffect, useState } from 'react';
import { useCartStore } from '../../store/cart';
import { createClient } from '../../utils/supabase/client';

interface RewardTier {
  id: string;
  name: string;
  description: string | null;
  order_milestone: number;
  reward_type: string;
}

interface UserReward {
  id: string;
  tier_id: string;
  reward_tiers: RewardTier;
}

interface RewardsData {
  orderCount: number;
  availableRewards: UserReward[];
  tiers: RewardTier[];
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

export function AuthenticatedCheckout({ user }: { user: any }) {
  const items = useCartStore((state) => state.items);
  const [status, setStatus] = useState<'review' | 'redirecting' | 'empty' | 'error'>('review');
  const [errorMsg, setErrorMsg] = useState('');

  // Discount state
  const [discountTab, setDiscountTab] = useState<'voucher' | 'reward'>('voucher');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; label: string; discountAmount: number; deliveryType?: string } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [freeProductId, setFreeProductId] = useState('');

  const cartSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => {
    if (items.length === 0) {
      setStatus('empty');
      return;
    }
    fetch('/api/rewards')
      .then(r => r.ok ? r.json() : null)
      .then(d => setRewardsData(d));
    const supabase = createClient();
    supabase.from('products').select('id, name').order('name').then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const handleApplyVoucher = async () => {
    setVoucherError('');
    setAppliedVoucher(null);
    if (!voucherInput.trim()) return;
    setValidatingVoucher(true);
    const res = await fetch('/api/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: voucherInput.trim(), cartTotal: cartSubtotal, customerEmail: user.email }),
    });
    setValidatingVoucher(false);
    if (!res.ok) {
      const d = await res.json();
      setVoucherError(d.error || 'Invalid code');
      return;
    }
    const d = await res.json();
    const deliveryType = (d.discount_type === 'free_delivery' || d.discount_type === 'one_pound_delivery')
      ? d.discount_type : undefined;
    setAppliedVoucher({
      code: d.code,
      label: d.discount_type === 'percentage' ? `${d.discount_value}% off`
        : d.discount_type === 'fixed' ? `£${d.discount_value} off`
        : d.discount_type === 'free_delivery' ? 'Free Delivery'
        : '£1 Delivery',
      discountAmount: d.discountAmount,
      deliveryType,
    });
    setSelectedRewardId(null);
  };

  const clearDiscount = () => {
    setAppliedVoucher(null);
    setSelectedRewardId(null);
    setVoucherInput('');
    setVoucherError('');
    setFreeProductId('');
  };

  const handleCheckout = async () => {
    setStatus('redirecting');
    try {
      const body: any = { items, userEmail: user.email };
      if (appliedVoucher) body.voucherCode = appliedVoucher.code;
      if (selectedRewardId) body.rewardId = selectedRewardId;
      if (freeProductId) body.freeProductId = freeProductId;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const session = await response.json();
      if (session.error) throw new Error(session.error);
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  if (status === 'empty') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'var(--grey)', fontSize: '1.2rem' }}>Your basket is empty.</p>
        <a href="/" style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid var(--gold)', paddingBottom: '2px', textDecoration: 'none', display: 'inline-block', marginTop: '1.5rem' }}>
          Browse Products
        </a>
      </div>
    );
  }

  if (status === 'redirecting') {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--grey)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Preparing your checkout...
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'red', marginBottom: '1rem' }}>Checkout failed: {errorMsg}</p>
        <button onClick={() => setStatus('review')} style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer', padding: '0.8rem 1.5rem', border: '1px solid var(--grey)', background: 'transparent' }}>
          Try Again
        </button>
      </div>
    );
  }

  const selectedReward = rewardsData?.availableRewards.find(r => r.id === selectedRewardId);

  // Calculate display totals
  const shippingCost =
    appliedVoucher?.deliveryType === 'free_delivery' ? 0
    : appliedVoucher?.deliveryType === 'one_pound_delivery' ? 1
    : selectedReward?.reward_tiers.reward_type === 'free_delivery' ? 0
    : 3.99;
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount
    : selectedReward?.reward_tiers.reward_type === 'percent_10' ? cartSubtotal * 0.1
    : selectedReward?.reward_tiers.reward_type === 'percent_20' ? cartSubtotal * 0.2
    : 0;
  const orderTotal = Math.max(0, cartSubtotal - discountAmount + shippingCost);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>
      {/* Left: Order summary */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Your Basket</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {items.map(item => (
            <div key={`${item.id}-${item.baseName}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.2rem', background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '3px' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{item.name}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase' }}>{item.baseName} &times; {item.quantity}</p>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>£{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Discount section */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Apply Discount</h3>

          {(appliedVoucher || selectedRewardId) ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: '#e8f5e9', borderRadius: '3px' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#2e7d32', fontWeight: 700 }}>
                  {appliedVoucher ? `${appliedVoucher.code} — ${appliedVoucher.label}` : `${selectedReward?.reward_tiers.name} — ${REWARD_TYPE_LABELS[selectedReward?.reward_tiers.reward_type ?? '']}`}
                </p>
                <button onClick={clearDiscount} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Remove</button>
              </div>
              {selectedReward?.reward_tiers.reward_type === 'free_item' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: '0.4rem' }}>
                    Choose your free product
                  </p>
                  <select
                    value={freeProductId}
                    onChange={e => setFreeProductId(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', border: `1px solid ${!freeProductId ? 'var(--gold)' : 'var(--cream-dark)'}`, borderRadius: '3px', fontFamily: 'var(--font-outfit)', fontSize: '0.9rem', background: 'var(--white)', color: 'var(--dark)' }}
                  >
                    <option value="">Select a product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {!freeProductId && (
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--choc-mid)', marginTop: '0.4rem' }}>
                      Select a product to continue
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, marginBottom: '1rem', border: '1px solid var(--cream-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                {(['voucher', 'reward'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDiscountTab(tab)}
                    style={{
                      flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                      background: discountTab === tab ? 'var(--dark)' : 'transparent',
                      color: discountTab === tab ? 'var(--gold)' : 'var(--grey)',
                    }}
                  >
                    {tab === 'voucher' ? 'Voucher Code' : `Rewards${rewardsData ? ` (${rewardsData.availableRewards.length})` : ''}`}
                  </button>
                ))}
              </div>

              {discountTab === 'voucher' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={voucherInput}
                    onChange={e => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                    placeholder="Enter code"
                    style={{ flex: 1, padding: '0.7rem 0.9rem', border: `1px solid ${voucherError ? 'red' : 'var(--cream-dark)'}`, borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <button onClick={handleApplyVoucher} disabled={validatingVoucher} style={{ padding: '0.7rem 1.2rem', background: 'var(--dark)', color: 'var(--gold)', border: 'none', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: validatingVoucher ? 0.6 : 1 }}>
                    {validatingVoucher ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {voucherError && <p style={{ color: 'red', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{voucherError}</p>}

              {discountTab === 'reward' && (
                <div>
                  {!rewardsData || rewardsData.availableRewards.length === 0 ? (
                    <div>
                      <p style={{ color: 'var(--grey)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>No rewards available yet.</p>
                      {rewardsData && (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--grey)' }}>
                          {rewardsData.orderCount} order{rewardsData.orderCount !== 1 ? 's' : ''} completed. A reward unlocks every 5.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {rewardsData.availableRewards.map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setSelectedRewardId(r.id); setAppliedVoucher(null); setVoucherError(''); }}
                          style={{
                            textAlign: 'left', padding: '0.8rem 1rem', border: `1px solid ${selectedRewardId === r.id ? 'var(--gold)' : 'var(--cream-dark)'}`,
                            borderRadius: '3px', background: selectedRewardId === r.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                            cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                          }}
                        >
                          <p style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{r.reward_tiers.name}</p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--choc-mid)' }}>
                            {REWARD_TYPE_LABELS[r.reward_tiers.reward_type]}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right: Summary + Pay */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.5rem', position: 'sticky', top: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>Order Summary</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--grey)', fontSize: '0.9rem' }}>Subtotal</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>£{cartSubtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--grey)', fontSize: '0.9rem' }}>Shipping</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              {shippingCost === 0 ? <span style={{ color: '#2e7d32' }}>Free</span> : `£${shippingCost.toFixed(2)}`}
            </span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#2e7d32', fontSize: '0.9rem' }}>Discount</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#2e7d32' }}>-£{discountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem' }}>£{orderTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={selectedReward?.reward_tiers.reward_type === 'free_item' && !freeProductId}
          className="btn btn-primary"
          style={{ width: '100%', padding: '1rem', fontSize: '0.9rem', opacity: selectedReward?.reward_tiers.reward_type === 'free_item' && !freeProductId ? 0.5 : 1 }}
        >
          Pay Now
        </button>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--grey)', textAlign: 'center', marginTop: '1rem' }}>
          A reward unlocks every 5 orders.
        </p>
      </div>
    </div>
  );
}

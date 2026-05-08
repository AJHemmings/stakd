"use client";

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  RECEIVED: { label: 'Order Received', color: '#e65100', bg: '#fff3e0' },
  PREPARING: { label: 'Preparing', color: '#f57c00', bg: '#ffe0b2' },
  BAKED: { label: 'Baked & Ready', color: '#006064', bg: '#e0f7fa' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#1565c0', bg: '#e3f2fd' },
  DELIVERED: { label: 'Delivered', color: '#2e7d32', bg: '#e8f5e9' },
};

interface OrderItem {
  product_name: string;
  base_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  created_at: string;
  fulfillment_status: string;
  total_amount: number;
  items?: OrderItem[];
  tracking_number?: string;
}

function OrderRow({ order, onTicketCreated }: { order: Order; onTicketCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const statusStyle = STATUS_STYLES[order.fulfillment_status] || { label: order.fulfillment_status, color: '#333', bg: '#eee' };
  const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const ref = order.id.substring(0, 8).toUpperCase();

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, orderReference: ref, message }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setShowTicketForm(false);
      setMessage('');
      onTicketCreated();
    }
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.2rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div className="order-row-left" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>#{ref}</span>
          <span style={{ fontSize: '0.95rem' }}>{date}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '0.25rem 0.7rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            {statusStyle.label}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--grey)', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--cream-dark)', background: 'var(--cream)' }}>
          {/* Items */}
          <div style={{ padding: '1.2rem 1.5rem' }}>
            {order.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                <span>
                  {item.quantity}x {item.product_name}
                  <span style={{ color: 'var(--grey)', fontSize: '0.85rem' }}> ({item.base_name})</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--grey)' }}>
                  £{(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--cream-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--grey)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gold)' }}>£{Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

            {order.tracking_number && (
              <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.3rem', fontWeight: 700, letterSpacing: '0.05em' }}>TRACKING NUMBER</p>
                  <a 
                    href={`https://www.royalmail.com/track-your-item?trackNumber=${order.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {order.tracking_number}
                    <ExternalLink size={14} />
                  </a>
                </div>
                <a 
                  href={`https://www.royalmail.com/track-your-item?trackNumber=${order.tracking_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: 'var(--gold)', color: 'var(--dark)', padding: '0.4rem 0.8rem', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textDecoration: 'none', transition: 'opacity 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  TRACKED
                </a>
              </div>
            )}

            {/* Support section */}
            <div style={{ borderTop: '1px solid var(--cream-dark)', padding: '1rem 1.5rem', marginTop: order.tracking_number ? '0' : '1.5rem' }}>
              {submitted ? (

              <p style={{ fontSize: '0.9rem', color: '#2e7d32', fontFamily: 'var(--font-mono)' }}>
                ✓ Support ticket submitted — we'll be in touch.
              </p>
            ) : showTicketForm ? (
              <form onSubmit={handleSubmitTicket}>
                <p style={{ fontSize: '0.85rem', color: 'var(--grey)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  Order #{ref} — what do you need help with?
                </p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue..."
                  required
                  rows={3}
                  style={{
                    width: '100%', padding: '0.75rem', border: '1px solid var(--cream-dark)',
                    borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                    resize: 'vertical', background: 'var(--white)', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    style={{
                      padding: '0.6rem 1.2rem', background: 'var(--dark)', color: 'var(--cream)',
                      border: 'none', borderRadius: '2px', fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600,
                      opacity: submitting || !message.trim() ? 0.6 : 1,
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowTicketForm(false); setMessage(''); }}
                    style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid var(--cream-dark)', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--grey)' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowTicketForm(true)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)',
                  textDecoration: 'underline', padding: 0,
                }}
              >
                Get support for this order
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderList({ orders, onTicketCreated }: { orders: Order[]; onTicketCreated: () => void }) {
  const active = orders.filter(o => o.fulfillment_status !== 'DELIVERED');
  const past = orders.filter(o => o.fulfillment_status === 'DELIVERED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--choc-mid)' }}>Active Orders</h2>
        {active.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--grey)' }}>No active orders.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {active.map(o => <OrderRow key={o.id} order={o} onTicketCreated={onTicketCreated} />)}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--choc-mid)' }}>Order History</h2>
        {past.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--grey)', marginBottom: '1rem' }}>No past orders yet.</p>
            <a href="/" style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid var(--gold)', paddingBottom: '2px', textDecoration: 'none' }}>Shop Now</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {past.map(o => <OrderRow key={o.id} order={o} onTicketCreated={onTicketCreated} />)}
          </div>
        )}
      </div>
    </div>
  );
}

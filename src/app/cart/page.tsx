"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../../store/cart';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const total = getTotalPrice();

  return (
    <div className="container" style={{ padding: '6rem 2rem' }}>
      <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4rem)', marginBottom: '3rem', borderBottom: '1px solid var(--cream-dark)', paddingBottom: '1rem' }}>
        YOUR BASKET
      </h1>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--grey)', marginBottom: '2rem' }}>Your basket is currently empty.</p>
          <Link href="/" style={{
            display: 'inline-block',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            textDecoration: 'none',
            borderBottom: '1px solid var(--gold)',
            paddingBottom: '2px'
          }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '4rem', alignItems: 'start' }}>

          {/* Cart Items */}
          <div>
            {items.map((item) => (
              <div key={item.id} style={{
                display: 'flex', gap: '2rem', padding: '2rem 0',
                borderBottom: '1px solid var(--cream-dark)', alignItems: 'center'
              }}>
                <div style={{
                  width: '100px', height: '100px', background: 'var(--dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ color: 'var(--gold)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>IMG</span>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{item.name}</h3>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>
                    Base: {item.baseName}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--choc-mid)', marginTop: '0.5rem' }}>
                    £{item.price.toFixed(2)}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--white)', padding: '0.5rem', border: '1px solid var(--cream-dark)' }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.5rem', fontSize: '1.2rem' }}
                  >-</button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.5rem', fontSize: '1.2rem' }}
                  >+</button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grey)', textDecoration: 'underline', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{ background: 'var(--white)', padding: '2rem', border: '1px solid var(--cream-dark)', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>ORDER SUMMARY</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span>£{total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 0', borderTop: '1px solid var(--cream-dark)', borderBottom: '1px solid var(--cream-dark)', marginBottom: '2rem' }}>
              <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '1.5rem' }}>TOTAL</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--choc-mid)' }}>£{total.toFixed(2)}</span>
            </div>

            {/* Disabled checkout — ordering not live yet */}
            <button
              disabled
              style={{
                width: '100%', padding: '1rem',
                background: 'var(--cream-dark)', color: 'var(--grey)',
                border: 'none', borderRadius: '2px',
                fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'not-allowed', opacity: 0.5
              }}
            >
              Checkout — Coming Soon
            </button>
          </div>

        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: '1fr 350px'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { useCartStore } from '../../store/cart';

export function AuthenticatedCheckout({ user }: { user: any }) {
  const [status, setStatus] = useState<'redirecting' | 'empty' | 'error'>('redirecting');
  const [errorMsg, setErrorMsg] = useState('');
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    if (items.length === 0) {
      setStatus('empty');
      return;
    }

    const doCheckout = async () => {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, userEmail: user.email }),
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

    doCheckout();
  }, []);

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

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: 'red', marginBottom: '1rem' }}>Checkout failed: {errorMsg}</p>
        <button onClick={() => window.location.reload()} style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer', padding: '0.8rem 1.5rem', border: '1px solid var(--grey)', background: 'transparent' }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--grey)' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Preparing your checkout...
      </p>
    </div>
  );
}

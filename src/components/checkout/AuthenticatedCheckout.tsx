"use client";

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '../../store/cart';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export function AuthenticatedCheckout({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const items = useCartStore((state) => state.items);

  const handleCheckout = async () => {
    if (items.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, userId: user.id }),
      });

      const session = await response.json();
      
      if (session.error) {
        throw new Error(session.error);
      }

      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("Failed to create checkout session URL");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome back!</h2>
      <p style={{ color: 'var(--grey)', marginBottom: '3rem' }}>
        You are logged in as <strong>{user.email}</strong>. Ready to complete your order?
      </p>
      
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--cream-dark)', paddingBottom: '1rem' }}>
          Delivery & Payment
        </h3>
        <p style={{ color: 'var(--grey)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          We'll use your saved shipping address (if available) or collect a new one at checkout.
        </p>
        
        <Button 
          variant="primary" 
          style={{ width: '100%', padding: '1.2rem' }} 
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </Button>
      </div>
    </div>
  );
}

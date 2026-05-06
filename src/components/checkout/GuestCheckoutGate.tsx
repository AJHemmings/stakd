"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { loadStripe } from '@stripe/stripe-js';
import { useCartStore } from '../../store/cart';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export function GuestCheckoutGate() {
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const items = useCartStore((state) => state.items);

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    if (items.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    setLoading(true);
    
    try {
      // Save to sessionStorage
      sessionStorage.setItem('guestCheckoutInfo', JSON.stringify({ name, email }));
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const session = await response.json();
      
      if (session.error) {
        throw new Error(session.error);
      }

      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        {/* Sign In */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Returning Customer</h2>
          <p style={{ color: 'var(--grey)', fontSize: '0.9rem', flexGrow: 1, marginBottom: '2rem' }}>
            Log in to your account for a faster checkout experience.
          </p>
          <Link href="/login?redirect=/checkout" style={{ textDecoration: 'none' }}>
            <Button variant="outline" style={{ width: '100%' }}>Sign In</Button>
          </Link>
        </div>

        {/* Create Account */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>New Customer</h2>
          <p style={{ color: 'var(--grey)', fontSize: '0.9rem', flexGrow: 1, marginBottom: '2rem' }}>
            Create an account to track your orders and checkout faster next time.
          </p>
          <Link href="/login?signup=true&redirect=/checkout" style={{ textDecoration: 'none' }}>
            <Button variant="outline" style={{ width: '100%' }}>Create Account</Button>
          </Link>
        </div>

        {/* Guest */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Guest Checkout</h2>
          <p style={{ color: 'var(--grey)', fontSize: '0.9rem', flexGrow: 1, marginBottom: '2rem' }}>
            Proceed to checkout without creating an account.
          </p>
          <Button 
            variant="primary" 
            style={{ width: '100%' }} 
            onClick={() => setShowGuestForm(true)}
          >
            Continue as Guest
          </Button>
        </div>
      </div>

      {showGuestForm && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--cream-dark)', paddingBottom: '1rem' }}>
            Guest Information
          </h2>
          <form onSubmit={handleGuestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Input 
              label="Full Name" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <Input 
              label="Email Address" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button variant="primary" type="submit" style={{ marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Redirecting to Payment...' : 'Continue to Payment'}
            </Button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

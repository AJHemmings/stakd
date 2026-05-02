"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { useCartStore } from '../../store/cart';
import { createClient } from '../../utils/supabase/client';

function SuccessContent() {
  const { clearCart } = useCartStore();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    // Clear the cart on successful checkout
    clearCart();

    if (sessionId) {
      const fetchOrder = async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('stripe_session_id', sessionId)
          .single();

        if (!error && data) {
          setOrder(data);
        }
        setLoading(false);
      };
      fetchOrder();
    }
  }, [clearCart, sessionId]);

  return (
    <div style={{ 
      minHeight: '80vh', display: 'flex', flexDirection: 'column', 
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' 
    }}>
      <div style={{ 
        width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gold)', 
        color: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        marginBottom: '2rem' 
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4rem)', marginBottom: '1rem' }}>
        {order ? `THANKS, ${order.customer_name.split(' ')[0].toUpperCase()}!` : 'PAYMENT SUCCESSFUL'}
      </h1>
      
      <p style={{ fontSize: '1.2rem', color: 'var(--grey)', maxWidth: '600px', marginBottom: '2rem', lineHeight: 1.6 }}>
        {order 
          ? `Order #${order.id.substring(0, 8).toUpperCase()} has been received. Our kitchen is getting ready to prepare your custom treats!`
          : "Thank you for your order! We have received your payment and our kitchen will start preparing your custom chocolate bars soon."
        }
      </p>

      {order && (
        <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--cream-dark)', paddingBottom: '0.5rem' }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {order.order_items.map((item: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.quantity}x {item.product_name} ({item.base_name})</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>£{(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--cream-dark)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--gold)' }}>£{Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {loading && <p style={{ marginBottom: '2rem', color: 'var(--grey)' }}>Loading your order details...</p>}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
        <Link href="/profile">
          <Button variant="primary">Track Order</Button>
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

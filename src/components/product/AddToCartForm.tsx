"use client";

import React, { useState } from 'react';
import { useCartStore } from '../../store/cart';

interface AddToCartFormProps {
  product: {
    id: string;
    name: string;
    price: number;
    sold_out: boolean;
  };
}

export function AddToCartForm({ product }: AddToCartFormProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);

  const handleAddToBasket = () => {
    if (product.sold_out) return;

    addItem({
      productId: product.id,
      name: product.name,
      baseId: 'standard', // default base
      baseName: 'Standard Base',
      price: product.price,
      quantity: quantity
    });

    alert('Added to basket!');
  };

  if (product.sold_out) {
    return (
      <div style={{
        border: '1px solid rgba(136,136,128,0.25)',
        borderRadius: '4px',
        padding: '2rem',
        textAlign: 'center',
        background: 'rgba(0,0,0,0.03)'
      }}>
        <p className="eyebrow" style={{ color: 'var(--grey)', marginBottom: '0.75rem' }}>
          Sold Out
        </p>
        <p style={{ color: 'var(--grey)', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
          This product is currently unavailable. Check back for restocks.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid rgba(201,168,76,0.3)',
      borderRadius: '4px',
      padding: '2rem',
      background: 'rgba(201,168,76,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--cream-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quantity
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--black)', padding: '0.5rem', border: '1px solid var(--cream-dark)' }}>
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.5rem', fontSize: '1.2rem', color: 'var(--white)' }}
          >-</button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', width: '20px', textAlign: 'center', color: 'var(--white)' }}>{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.5rem', fontSize: '1.2rem', color: 'var(--white)' }}
          >+</button>
        </div>
      </div>

      <button
        onClick={handleAddToBasket}
        style={{
          width: '100%',
          padding: '1.2rem',
          background: 'var(--gold)',
          color: 'var(--black)',
          border: 'none',
          borderRadius: '2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '1rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontWeight: 700,
          transition: 'background 0.2s ease'
        }}
      >
        Add to Basket — £{(product.price * quantity).toFixed(2)}
      </button>
    </div>
  );
}

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
  const [added, setAdded] = useState(false);

  const handleAddToBasket = () => {
    if (product.sold_out) return;

    addItem({
      productId: product.id,
      name: product.name,
      baseId: 'standard',
      baseName: 'Standard Base',
      price: product.price,
      quantity: quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div style={{
      border: '1px solid rgba(136,136,128,0.25)',
      borderRadius: '4px',
      padding: '2rem',
      textAlign: 'center',
      background: 'rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          style={{
            width: '2.5rem',
            height: '2.5rem',
            background: 'transparent',
            border: '1px solid rgba(136,136,128,0.4)',
            borderRadius: '2px',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >−</button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', minWidth: '1.5rem', textAlign: 'center' }}>{quantity}</span>
        <button
          onClick={() => setQuantity(q => q + 1)}
          style={{
            width: '2.5rem',
            height: '2.5rem',
            background: 'transparent',
            border: '1px solid rgba(136,136,128,0.4)',
            borderRadius: '2px',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >+</button>
      </div>
      <button
        onClick={handleAddToBasket}
        disabled={product.sold_out}
        style={{
          width: '100%',
          padding: '1.2rem',
          background: product.sold_out ? 'rgba(136,136,128,0.15)' : added ? 'var(--gold)' : 'var(--foreground)',
          color: product.sold_out ? 'var(--grey)' : 'var(--background)',
          border: '1px solid rgba(136,136,128,0.25)',
          borderRadius: '2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '1rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 700,
          cursor: product.sold_out ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        {product.sold_out ? 'Sold Out' : added ? 'Added ✓' : 'Add to Basket'}
      </button>
    </div>
  );
}

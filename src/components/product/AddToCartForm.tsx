"use client";

import React from 'react';

interface AddToCartFormProps {
  product: {
    id: string;
    name: string;
    price: number;
    sold_out: boolean;
  };
}

export function AddToCartForm({ product }: AddToCartFormProps) {
  return (
    <div style={{
      border: '1px solid rgba(136,136,128,0.25)',
      borderRadius: '4px',
      padding: '2rem',
      textAlign: 'center',
      background: 'rgba(0,0,0,0.03)'
    }}>
      <button
        disabled
        style={{
          width: '100%',
          padding: '1.2rem',
          background: 'rgba(136,136,128,0.15)',
          color: 'var(--grey)',
          border: '1px solid rgba(136,136,128,0.25)',
          borderRadius: '2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '1rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 700,
          cursor: 'not-allowed',
        }}
      >
        Coming Soon
      </button>
    </div>
  );
}

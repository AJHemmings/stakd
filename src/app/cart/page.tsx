"use client";

import React from 'react';
import Link from 'next/link';

export default function CartPage() {
  return (
    <div className="container" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
      <p className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '1.5rem' }}>Ordering Coming Soon</p>
      <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '1.5rem', color: 'var(--dark)' }}>
        Not Quite Yet
      </h1>
      <p style={{ color: 'var(--grey)', fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto 3rem', lineHeight: '1.8' }}>
        We&apos;re putting the finishing touches on ordering. Browse the collection and check back soon.
      </p>
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
        &larr; Back to Home
      </Link>
    </div>
  );
}

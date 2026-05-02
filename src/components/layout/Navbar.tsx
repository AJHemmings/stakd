"use client";

import React from 'react';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2.5rem',
      height: '64px'
    }}>
      <Link href="/" style={{
        fontFamily: 'var(--font-bebas)',
        fontSize: '1.8rem',
        color: 'var(--gold)',
        letterSpacing: '0.12em',
        textDecoration: 'none'
      }}>
        STAK'D
      </Link>
      <ul style={{
        listStyle: 'none', display: 'flex', gap: '2.5rem', margin: 0, padding: 0
      }}>
        <li>
          <Link href="/profile" style={{
            color: 'var(--cream-dark)',
            fontSize: '0.85rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', fontWeight: 600
          }}>
            Account
          </Link>
        </li>
      </ul>
    </nav>
  );
}

import React from 'react';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/server';
import { CartCount } from '../cart/CartCount';

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
          <Link href={user ? "/profile" : "/login"} style={{
            color: 'var(--cream-dark)',
            fontSize: '0.85rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', fontWeight: 600
          }}>
            {user ? "Account" : "Log In"}
          </Link>
        </li>
        {user?.user_metadata?.role === 'admin' && (
          <li>
            <Link href="/admin" style={{
              color: 'var(--gold)',
              fontSize: '0.85rem', letterSpacing: '0.08em',
              textTransform: 'uppercase', fontWeight: 700,
              background: 'rgba(201,168,76,0.1)',
              padding: '0.4rem 0.8rem',
              borderRadius: '2px',
              border: '1px solid var(--gold)'
            }}>
              Dashboard
            </Link>
          </li>
        )}
        <li>
          <Link href="/cart" style={{
            color: 'var(--cream-dark)',
            fontSize: '0.85rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', fontWeight: 600
          }}>
            <CartCount />
          </Link>
        </li>
      </ul>
    </nav>
  );
}

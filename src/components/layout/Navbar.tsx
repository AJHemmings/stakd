import React from 'react';
import Link from 'next/link';
import { createClient } from '../../utils/supabase/server';
import { isAdminEmail } from '../../utils/auth/require-admin';
import { CartCount } from '../cart/CartCount';

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="navbar">
      <Link href="/" style={{
        fontFamily: 'var(--font-bebas)',
        fontSize: '1.8rem',
        color: 'var(--gold)',
        letterSpacing: '0.12em',
        textDecoration: 'none',
        flexShrink: 0,
      }}>
        STAK'D
      </Link>
      <ul className="navbar-links">
        <li>
          <Link href={user ? "/profile" : "/login"} style={{
            color: 'var(--cream-dark)',
            fontSize: '0.85rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', fontWeight: 600
          }}>
            {user ? "Account" : "Log In"}
          </Link>
        </li>
        <li>
          <Link href="/faq" style={{
            color: 'var(--cream-dark)',
            fontSize: '0.85rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', fontWeight: 600
          }}>
            FAQ
          </Link>
        </li>
        {isAdminEmail(user?.email) && (
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

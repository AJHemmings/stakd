import React from 'react';

export function Footer() {
  return (
    <footer style={{
      background: 'var(--black)',
      color: 'var(--grey)',
      textAlign: 'center',
      padding: '4rem 2rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.72rem',
      letterSpacing: '0.12em',
      marginTop: 'auto'
    }}>
      <span style={{
        fontFamily: 'var(--font-bebas)',
        fontSize: '2.2rem',
        color: 'var(--gold)',
        letterSpacing: '0.15em',
        display: 'block',
        marginBottom: '1rem'
      }}>
        STAK'D
      </span>
      <p>&copy; {new Date().getFullYear()} STAK'D CHOCOLATE. ALL RIGHTS RESERVED.</p>
      <p style={{ marginTop: '1rem' }}>PREMIUM DEEP-FILLED CHOCOLATE BARS · MADE TO ORDER</p>
    </footer>
  );
}

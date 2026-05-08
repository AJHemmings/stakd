import React from 'react';
import Link from 'next/link';
import { CakeSlice, Cookie, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'var(--black)',
        minHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '6rem 2rem 4rem',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle radial glow matching brand kit */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(92,51,23,0.45) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>

        <p className="eyebrow" style={{ marginBottom: '1.8rem', position: 'relative' }}>
          EST · 2026
        </p>
        <h1 style={{
          position: 'relative',
          margin: '0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '900px'
        }}>
          <img
            src="/hero-logo.png"
            alt="STAK'D Logo"
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 120px rgba(201,168,76,0.25))'
            }}
          />
        </h1>
        <p className="tagline" style={{ color: 'var(--cream-dark)', marginTop: '1.6rem', position: 'relative' }}>
          Made to order. Stacked with filling. No compromise.
        </p>

        {/* Quality trust badge */}
        <div style={{ marginTop: '2rem', maxWidth: '90vw' }}>
          <div className="hero-badge" style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em',
            color: 'rgba(245,240,232,0.55)',
            border: '2px solid var(--gold)',
            borderRadius: '100px',
            padding: '0.4rem 1.4rem',
            background: 'rgba(201,168,76,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span>COUVERTURE CHOCOLATE</span>
            <span className="hero-badge-sep">&nbsp;·&nbsp;</span>
            <span>REAL INGREDIENTS</span>
            <span className="hero-badge-sep">&nbsp;·&nbsp;</span>
            <span>NO E-NUMBERS</span>
          </div>
        </div>

        {/* Category Icons Selection */}
        <div style={{
          marginTop: '4rem',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          gap: '3rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link href="/category/cake" className="category-icon-link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '80px', height: '80px',
              borderRadius: '50%',
              background: 'rgba(201, 168, 76, 0.1)',
              border: '2px solid var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gold)',
              transition: 'all 0.3s ease'
            }} className="icon-circle">
              <CakeSlice size={36} strokeWidth={1.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.15em', color: 'var(--cream-dark)' }}>CAKE</span>
          </Link>

          <Link href="/category/cookie" className="category-icon-link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '80px', height: '80px',
              borderRadius: '50%',
              background: 'rgba(201, 168, 76, 0.1)',
              border: '2px solid var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gold)',
              transition: 'all 0.3s ease'
            }} className="icon-circle">
              <Cookie size={36} strokeWidth={1.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.15em', color: 'var(--cream-dark)' }}>COOKIE</span>
          </Link>

          <Link href="/category/fusion" className="category-icon-link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '80px', height: '80px',
              borderRadius: '50%',
              background: 'rgba(201, 168, 76, 0.1)',
              border: '2px solid var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gold)',
              transition: 'all 0.3s ease'
            }} className="icon-circle">
              <Sparkles size={36} strokeWidth={1.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.15em', color: 'var(--cream-dark)' }}>FUSION</span>
          </Link>
        </div>
      </section>

      {/* Global CSS overrides for the icon hovers just for this page for now */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .category-icon-link:hover .icon-circle {
          background: var(--gold) !important;
          color: var(--black) !important;
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(201, 168, 76, 0.4);
        }
        .category-icon-link:hover span {
          color: var(--gold) !important;
        }
        @media (max-width: 600px) {
          .hero-badge {
            flex-direction: column !important;
            border-radius: 12px !important;
            padding: 0.7rem 1.2rem !important;
            gap: 0.4rem;
          }
          .hero-badge-sep {
            display: none;
          }
        }
      `}} />
    </div>
  );
}

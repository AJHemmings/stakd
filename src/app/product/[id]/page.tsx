"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Mock database (in real app, fetch from Supabase)
// Toggle limitedTime / soldOut per product to show/hide badges
const PRODUCTS = {
  'plain-cookie-dough': { name: 'Plain Cookie Dough', basePrice: 5.99, description: 'Our signature thick cookie dough, completely unadulterated. Pure, rich, and gooey.', image: '/cookie.png', limitedTime: false, soldOut: false },
  'choc-chip-cookie-dough': { name: 'Chocolate Chip Cookie Dough', basePrice: 6.99, description: 'Classic cookie dough loaded with premium Belgian chocolate chips.', image: '/cookie.png', limitedTime: false, soldOut: false },
  'dark-choc-chip-cookie-dough': { name: 'Dark Choc Chip Cookie Dough', basePrice: 6.99, description: 'Rich cookie dough with intense 70% dark chocolate chips.', image: '/cookie.png', limitedTime: false, soldOut: false },
  'pistachio-cookie-dough': { name: 'Pistachio Cookie Dough', basePrice: 7.99, description: 'Premium roasted pistachios folded into our signature dough.', image: '/cookie.png', limitedTime: true, soldOut: false },
  'peanut-butter-cookie-dough': { name: 'Peanut Butter Cookie Dough', basePrice: 6.99, description: 'Swirls of smooth peanut butter in rich cookie dough.', image: '/cookie.png', limitedTime: false, soldOut: false },
  'fudge-cookie-dough': { name: 'Fudge Cookie Dough', basePrice: 6.49, description: 'Gooey fudge pieces mixed into our classic dough.', limitedTime: false, soldOut: false },

  'classic-sponge': { name: 'Classic Vanilla Sponge', basePrice: 5.99, description: 'Light, fluffy Madagascar vanilla sponge cake.', image: '/sponge.png', limitedTime: false, soldOut: false },
  'coffee-walnut': { name: 'Coffee & Walnut', basePrice: 6.99, description: 'Espresso-infused sponge with crushed toasted walnuts.', image: '/coffee-cake.png', limitedTime: false, soldOut: false },
  'rich-brownie': { name: 'Rich Fudge Brownie', basePrice: 7.49, description: 'Dense, intensely chocolatey fudge brownie layer.', image: '/brownie.png', limitedTime: false, soldOut: true },

  'salted-caramel': { name: 'Salted Caramel Flow', basePrice: 6.99, description: 'Liquid gold salted caramel that flows when you bite.', limitedTime: false, soldOut: false },
  'ny-cheesecake': { name: 'NY Vanilla Cheesecake', basePrice: 7.99, description: 'Baked vanilla cheesecake filling.', limitedTime: false, soldOut: false },
};

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const product = PRODUCTS[productId as keyof typeof PRODUCTS];
  const router = useRouter();

  if (!product) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h1>Product not found</h1>
        <Link href="/" className="btn btn-outline" style={{ marginTop: '2rem' }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 2rem', paddingBottom: '8rem' }}>
      <button 
        onClick={() => router.back()} 
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, 
          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)',
          textDecoration: 'none'
        }}
      >
        &larr; BACK
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem',
        marginTop: '2rem',
        alignItems: 'start'
      }}>
        {/* Left: Product Image */}
        <div style={{
          aspectRatio: '1',
          background: 'linear-gradient(145deg, var(--choc) 0%, var(--black) 100%)',
          borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--cream-dark)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {('image' in product && typeof product.image === 'string') ? (
            <Image src={product.image} alt={product.name} fill style={{ objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
              [ High Quality Cross-Section Image ]
            </span>
          )}
        </div>

        {/* Right: Product Details & Form */}
        <div>
          <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '0.75rem', color: 'var(--dark)' }}>
            {product.name}
          </h1>
          {(product.limitedTime || product.soldOut) && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {product.limitedTime && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em',
                  color: 'var(--gold-light)', border: '1px solid var(--gold-light)', borderRadius: '2px',
                  padding: '0.4rem 0.9rem', background: 'rgba(232,201,106,0.1)',
                  boxShadow: '0 0 10px rgba(232,201,106,0.3)'
                }}>LIMITED TIME</span>
              )}
              {product.soldOut && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em',
                  color: 'var(--grey)', border: '1px solid rgba(136,136,128,0.4)', borderRadius: '2px',
                  padding: '0.35rem 0.75rem', background: 'rgba(0,0,0,0.06)'
                }}>SOLD OUT</span>
              )}
            </div>
          )}
          <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: 'var(--choc-mid)', fontWeight: 700, marginBottom: '2rem' }}>
            £{product.basePrice.toFixed(2)}
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--grey)', marginBottom: '3rem', lineHeight: '1.8' }}>
            {product.description}
          </p>

          <div style={{
            border: product.soldOut ? '1px solid rgba(136,136,128,0.25)' : '1px solid rgba(201,168,76,0.3)',
            borderRadius: '4px',
            padding: '2rem',
            textAlign: 'center',
            background: product.soldOut ? 'rgba(0,0,0,0.03)' : 'rgba(201,168,76,0.04)'
          }}>
            <p className="eyebrow" style={{ color: product.soldOut ? 'var(--grey)' : 'var(--gold)', marginBottom: '0.75rem' }}>
              {product.soldOut ? 'Sold Out' : 'Coming Soon'}
            </p>
            <p style={{ color: 'var(--grey)', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
              {product.soldOut
                ? 'This product is currently unavailable. Check back for restocks.'
                : 'Orders will open shortly. Check back soon.'}
            </p>
          </div>

        </div>
      </div>

      {/* Global CSS for the back link - temporary fix since it's client side */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

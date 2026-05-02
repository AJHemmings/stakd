"use client";

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { useCartStore } from '../../../store/cart';
import Image from 'next/image';

// Mock database (in real app, fetch from Supabase)
const PRODUCTS = {
  'plain-cookie-dough': { name: 'Plain Cookie Dough', basePrice: 5.99, description: 'Our signature thick cookie dough, completely unadulterated. Pure, rich, and gooey.', image: '/cookie.png' },
  'choc-chip-cookie-dough': { name: 'Chocolate Chip Cookie Dough', basePrice: 6.99, description: 'Classic cookie dough loaded with premium Belgian chocolate chips.', image: '/cookie.png' },
  'dark-choc-chip-cookie-dough': { name: 'Dark Choc Chip Cookie Dough', basePrice: 6.99, description: 'Rich cookie dough with intense 70% dark chocolate chips.', image: '/cookie.png' },
  'pistachio-cookie-dough': { name: 'Pistachio Cookie Dough', basePrice: 7.99, description: 'Premium roasted pistachios folded into our signature dough.', image: '/cookie.png' },
  'peanut-butter-cookie-dough': { name: 'Peanut Butter Cookie Dough', basePrice: 6.99, description: 'Swirls of smooth peanut butter in rich cookie dough.', image: '/cookie.png' },
  'fudge-cookie-dough': { name: 'Fudge Cookie Dough', basePrice: 6.49, description: 'Gooey fudge pieces mixed into our classic dough.' },
  
  'classic-sponge': { name: 'Classic Vanilla Sponge', basePrice: 5.99, description: 'Light, fluffy Madagascar vanilla sponge cake.', image: '/sponge.png' },
  'coffee-walnut': { name: 'Coffee & Walnut', basePrice: 6.99, description: 'Espresso-infused sponge with crushed toasted walnuts.', image: '/coffee-cake.png' },
  'rich-brownie': { name: 'Rich Fudge Brownie', basePrice: 7.49, description: 'Dense, intensely chocolatey fudge brownie layer.', image: '/brownie.png' },
  
  'salted-caramel': { name: 'Salted Caramel Flow', basePrice: 6.99, description: 'Liquid gold salted caramel that flows when you bite.' },
  'ny-cheesecake': { name: 'NY Vanilla Cheesecake', basePrice: 7.99, description: 'Baked vanilla cheesecake filling.' },
};

const BASES = [
  { id: 'milk', name: 'Milk Chocolate', priceModifier: 0 },
  { id: 'dark', name: 'Dark Chocolate', priceModifier: 0 },
  { id: 'white', name: 'White Chocolate', priceModifier: 0.50 }, // White chocolate costs slightly more
];

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15+ async params
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const product = PRODUCTS[productId as keyof typeof PRODUCTS];
  const router = useRouter();
  
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  if (!product) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h1>Product not found</h1>
        <Link href="/" className="btn btn-outline" style={{ marginTop: '2rem' }}>Back to Home</Link>
      </div>
    );
  }

  const currentPriceModifier = selectedBase ? (BASES.find(b => b.id === selectedBase)?.priceModifier || 0) : 0;
  const finalPrice = product.basePrice + currentPriceModifier;

  const handleAddToCart = () => {
    if (!selectedBase) return;
    const baseName = BASES.find(b => b.id === selectedBase)?.name || '';
    
    addItem({
      productId,
      name: product.name,
      baseId: selectedBase,
      baseName,
      price: finalPrice,
      quantity: 1
    });
    
    // Optional: Could show a toast notification here
    alert("Added to basket!");
  };

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
          <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1rem', color: 'var(--dark)' }}>
            {product.name}
          </h1>
          <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: 'var(--choc-mid)', fontWeight: 700, marginBottom: '2rem' }}>
            £{finalPrice.toFixed(2)}
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--grey)', marginBottom: '3rem', lineHeight: '1.8' }}>
            {product.description}
          </p>

          <div style={{ marginBottom: '3rem' }}>
            <p className="eyebrow" style={{ marginBottom: '1rem', color: 'var(--dark)' }}>01 — Add to Order</p>
            <p style={{ color: 'var(--grey)' }}>Custom base selections are currently disabled. You will receive our standard signature base.</p>
          </div>

          <Button 
            variant="primary" 
            style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
            onClick={() => {
              addItem({
                productId,
                name: product.name,
                baseId: 'milk',
                baseName: 'Milk Chocolate',
                price: product.basePrice,
                quantity: 1
              });
              alert("Added to basket!");
            }}
          >
            Add to Basket
          </Button>

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

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProductBySlug } from '../../../utils/supabase/queries';
import { AddToCartForm } from '../../../components/product/AddToCartForm';
import { IngredientsModal } from '../../../components/product/IngredientsModal';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    console.error("Error fetching product:", error);
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h1>Product not found</h1>
        <Link href="/" className="btn btn-outline" style={{ marginTop: '2rem' }}>Back to Home</Link>
      </div>
    );
  }

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
      <Link 
        href={`/category/${product.categories.slug}`}
        style={{ 
          display: 'inline-block',
          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)',
          textDecoration: 'none', marginBottom: '2rem'
        }}
      >
        &larr; BACK TO {product.categories.name.toUpperCase()}
      </Link>

      <div className="product-layout">
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
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill style={{ objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
              [ High Quality Cross-Section Image ]
            </span>
          )}
          {product.badge_text && (
            <div style={{
              position: 'absolute', bottom: '20px', right: '20px',
              background: 'var(--gold)', color: 'var(--black)',
              width: '100px', height: '100px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '1rem', fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)', fontWeight: 900, lineHeight: '1.2',
              zIndex: 3, transform: 'rotate(-5deg)',
              border: '3px solid var(--black)',
              boxShadow: '0 10px 0 rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.5)'
            }}>
              {product.badge_text}
            </div>
          )}
        </div>

        {/* Right: Product Details & Form */}
        <div>
          <h1 className="product-heading" style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '0.75rem', color: 'var(--dark)' }}>
            {product.name}
          </h1>
          {(product.limited_time || product.sold_out) && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {product.limited_time && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em',
                  color: 'var(--gold-light)', border: '1px solid var(--gold-light)', borderRadius: '2px',
                  padding: '0.4rem 0.9rem', background: 'rgba(232,201,106,0.1)',
                  boxShadow: '0 0 10px rgba(232,201,106,0.3)'
                }}>LIMITED TIME</span>
              )}
              {product.sold_out && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em',
                  color: 'var(--grey)', border: '1px solid rgba(136,136,128,0.4)', borderRadius: '2px',
                  padding: '0.35rem 0.75rem', background: 'rgba(0,0,0,0.06)'
                }}>SOLD OUT</span>
              )}
            </div>
          )}
          <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: 'var(--choc-mid)', fontWeight: 700, marginBottom: '2rem' }}>
            £{Number(product.price).toFixed(2)}
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--grey)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            {product.description}
          </p>

          <IngredientsModal 
            ingredients={product.ingredients}
            weight={product.weight}
            calories={product.calories}
            allergens={product.allergens}
          />

          <div style={{ marginTop: '3rem' }}>
            <AddToCartForm product={{
              id: product.id,
              name: product.name,
              price: Number(product.price),
              sold_out: product.sold_out
            }} />
          </div>

        </div>
      </div>

    </div>
  );
}

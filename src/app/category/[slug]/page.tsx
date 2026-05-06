import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCategoryBySlug } from '../../../utils/supabase/queries';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let data;
  try {
    data = await getCategoryBySlug(slug);
  } catch (error) {
    console.error("Error fetching category:", error);
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h1>Category not found</h1>
        <Link href="/" className="btn btn-outline" style={{ marginTop: '2rem' }}>Back to Home</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h1>Category not found</h1>
        <Link href="/" className="btn btn-outline" style={{ marginTop: '2rem' }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '6rem' }}>
      {/* Category Header */}
      <section style={{
        background: 'var(--black)',
        padding: '6rem 2rem 4rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(201,168,76,0.2)'
      }}>
        <p className="eyebrow">The Collection</p>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: 'var(--gold)', margin: '1rem 0' }}>
          {data.name}
        </h1>
        <p style={{ color: 'var(--cream-dark)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
          {data.description}
        </p>
      </section>

      {/* Product Grid */}
      <section className="container" style={{ marginTop: '4rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2.5rem'
        }}>
          {data.products.map((product: any) => (
            <Link key={product.id} href={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Image Placeholder (Cross-section) */}
                <div style={{
                  height: '240px',
                  background: 'linear-gradient(145deg, var(--choc) 0%, var(--black) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderBottom: '1px solid var(--cream-dark)',
                  position: 'relative'
                }}>
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                      [ Cross Section Image ]
                    </span>
                  )}
                  {(product.limited_time || product.sold_out) && (
                    <div style={{
                      position: 'absolute', top: '0.75rem', right: '0.75rem',
                      display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end',
                      zIndex: 2
                    }}>
                      {product.limited_time && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.12em',
                          color: 'var(--gold-light)', background: 'rgba(17,17,16,0.9)',
                          border: '1px solid var(--gold-light)', borderRadius: '2px',
                          padding: '0.35rem 0.7rem',
                          boxShadow: '0 0 8px rgba(232,201,106,0.35)'
                        }}>LIMITED TIME</span>
                      )}
                      {product.sold_out && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em',
                          color: 'var(--grey)', background: 'rgba(17,17,16,0.88)',
                          border: '1px solid rgba(136,136,128,0.4)', borderRadius: '2px',
                          padding: '0.3rem 0.6rem'
                        }}>SOLD OUT</span>
                      )}
                    </div>
                  )}
                  {product.badge_text && (
                    <div style={{
                      position: 'absolute', bottom: '-15px', right: '15px',
                      background: 'var(--gold)', color: 'var(--black)',
                      width: '80px', height: '80px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textAlign: 'center', padding: '0.5rem', fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)', fontWeight: 900, lineHeight: '1.2',
                      zIndex: 3, transform: 'rotate(15deg)',
                      border: '3px solid var(--black)',
                      boxShadow: '0 10px 0 rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                      {product.badge_text}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.6rem', lineHeight: '1.2', marginBottom: '0.5rem', color: 'var(--dark)' }}>
                    {product.name}
                  </h3>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--choc-mid)' }}>
                      £{Number(product.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

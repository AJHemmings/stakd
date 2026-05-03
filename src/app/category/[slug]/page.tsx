import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Mock database for now
// Toggle limitedTime / soldOut per product to show/hide badges
const CATEGORY_DATA = {
  cookie: {
    title: 'Cookie Series',
    description: 'Crunchy, chewy, and loaded with inclusions. The ultimate texture experience.',
    products: [
      { id: 'plain-cookie-dough', name: 'Plain Cookie Dough', price: 5.99, image: '/cookie.png', limitedTime: false, soldOut: false },
      { id: 'choc-chip-cookie-dough', name: 'Chocolate Chip Cookie Dough', price: 6.99, image: '/cookie.png', limitedTime: false, soldOut: false },
      { id: 'dark-choc-chip-cookie-dough', name: 'Dark Choc Chip Cookie Dough', price: 6.99, image: '/cookie.png', limitedTime: false, soldOut: false },
      { id: 'pistachio-cookie-dough', name: 'Pistachio Cookie Dough', price: 7.99, image: '/cookie.png', limitedTime: true, soldOut: false },
      { id: 'peanut-butter-cookie-dough', name: 'Peanut Butter Cookie Dough', price: 6.99, image: '/cookie.png', limitedTime: false, soldOut: false },
      { id: 'fudge-cookie-dough', name: 'Fudge Cookie Dough', price: 6.49, limitedTime: false, soldOut: false },
    ]
  },
  cake: {
    title: 'Cake Series',
    description: 'Soft, rich sponge cake enveloped in our signature thick chocolate shell.',
    products: [
      { id: 'classic-sponge', name: 'Classic Vanilla Sponge', price: 5.99, image: '/sponge.png', limitedTime: false, soldOut: false },
      { id: 'coffee-walnut', name: 'Coffee & Walnut', price: 6.99, image: '/coffee-cake.png', limitedTime: false, soldOut: false },
      { id: 'rich-brownie', name: 'Rich Fudge Brownie', price: 7.49, image: '/brownie.png', limitedTime: false, soldOut: true },
    ]
  },
  fusion: {
    title: 'Fusion Series',
    description: 'Wild flavor combinations. Caramel, cheesecake, and specialty fillings.',
    products: [
      { id: 'peanut-butter-salted-caramel', name: 'Peanut Butter and Salted Caramel Pretzel', price: 7.49, limitedTime: false, soldOut: false },
      { id: 'ny-cheesecake', name: 'NY Vanilla Cheesecake', price: 7.99, limitedTime: false, soldOut: false },
    ]
  }
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Need to safely get data and default if invalid slug
  const data = CATEGORY_DATA[slug as keyof typeof CATEGORY_DATA];

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
          {data.title}
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
          {data.products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Image Placeholder (Cross-section) */}
                <div style={{
                  height: '240px',
                  background: 'linear-gradient(145deg, var(--choc) 0%, var(--black) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderBottom: '1px solid var(--cream-dark)',
                  position: 'relative'
                }}>
                  {'image' in product && typeof product.image === 'string' ? (
                    <Image src={product.image} alt={product.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                      [ Cross Section Image ]
                    </span>
                  )}
                  {(product.limitedTime || product.soldOut) && (
                    <div style={{
                      position: 'absolute', top: '0.75rem', right: '0.75rem',
                      display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end',
                      zIndex: 2
                    }}>
                      {product.limitedTime && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.12em',
                          color: 'var(--gold-light)', background: 'rgba(17,17,16,0.9)',
                          border: '1px solid var(--gold-light)', borderRadius: '2px',
                          padding: '0.35rem 0.7rem',
                          boxShadow: '0 0 8px rgba(232,201,106,0.35)'
                        }}>LIMITED TIME</span>
                      )}
                      {product.soldOut && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em',
                          color: 'var(--grey)', background: 'rgba(17,17,16,0.88)',
                          border: '1px solid rgba(136,136,128,0.4)', borderRadius: '2px',
                          padding: '0.3rem 0.6rem'
                        }}>SOLD OUT</span>
                      )}
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
                      £{product.price.toFixed(2)}
                    </span>
                    <span className="eyebrow" style={{
                      color: 'var(--cream)',
                      background: 'var(--choc-mid)',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '2px',
                      fontSize: '0.7rem',
                      letterSpacing: '0.12em'
                    }}>Coming Soon</span>
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

"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface IngredientsModalProps {
  ingredients: string | null;
  weight: string | null;
  calories: string | null;
  allergens: string[] | null;
}

export function IngredientsModal({ ingredients, weight, calories, allergens }: IngredientsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!ingredients && !weight && !calories) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: 'none', border: 'none',
          color: 'var(--gold)', fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem', letterSpacing: '0.1em',
          cursor: 'pointer', textDecoration: 'underline',
          padding: 0, marginTop: '1rem'
        }}
      >
        VIEW INGREDIENTS & NUTRITION
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '2rem'
        }}>
          <div style={{
            background: 'var(--black)',
            border: '2px solid var(--gold)',
            borderRadius: '4px',
            width: '100%', maxWidth: '500px',
            padding: '2.5rem',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'none', border: 'none', color: 'var(--cream-dark)',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            <h2 style={{ color: 'var(--gold)', fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-bebas)', letterSpacing: '0.05em' }}>
              Ingredients & Info
            </h2>

            {allergens && allergens.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#ff4444', marginBottom: '0.6rem', fontWeight: 700 }}>CONTAINS:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {allergens.map(a => (
                    <span key={a} style={{ 
                      background: 'rgba(255, 68, 68, 0.1)', 
                      color: '#ff4444', 
                      border: '1px solid rgba(255, 68, 68, 0.4)',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      borderRadius: '2px',
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(weight || calories) && (
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                {weight && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--grey)', marginBottom: '0.2rem' }}>WEIGHT</p>
                    <p style={{ color: 'var(--gold)', fontWeight: 700 }}>{weight}</p>
                  </div>
                )}
                {calories && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--grey)', marginBottom: '0.2rem' }}>CALORIES</p>
                    <p style={{ color: 'var(--gold)', fontWeight: 700 }}>{calories}</p>
                  </div>
                )}
              </div>
            )}

            {ingredients && (
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--grey)', marginBottom: '0.5rem' }}>FULL INGREDIENTS</p>
                <p style={{ color: 'var(--cream)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {ingredients}
                </p>
              </div>
            )}

            <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--grey)', fontStyle: 'italic' }}>
              *Allergens: Please note our kitchen handles nuts, dairy, wheat, and eggs.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

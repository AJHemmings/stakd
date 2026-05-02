"use client";

import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function AdminProductsPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>PRODUCTS</h1>
          <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>Manage your inventory and categories.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add New Product'}
        </Button>
      </div>

      {showAddForm && (
        <div className="card" style={{ padding: '2rem', marginBottom: '3rem', borderLeft: '4px solid var(--gold)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Add New Product</h2>
          <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Input label="Product Name" required />
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>
                  Category
                </label>
                <select style={{ 
                  width: '100%', padding: '1rem', 
                  border: '1px solid var(--cream-dark)', borderRadius: '2px',
                  fontFamily: 'var(--font-outfit)', fontSize: '1rem'
                }}>
                  <option value="cake">Cake</option>
                  <option value="cookie">Cookie</option>
                  <option value="fusion">Fusion</option>
                </select>
              </div>
              <Input label="Base Price (£)" type="number" step="0.01" required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>
                  Description
                </label>
                <textarea 
                  rows={4}
                  style={{ 
                    width: '100%', padding: '1rem', 
                    border: '1px solid var(--cream-dark)', borderRadius: '2px',
                    fontFamily: 'var(--font-outfit)', fontSize: '1rem', resize: 'vertical'
                  }}
                ></textarea>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>
                  Cross-Section Image
                </label>
                <div style={{ 
                  border: '2px dashed var(--cream-dark)', padding: '2rem', textAlign: 'center', cursor: 'pointer',
                  background: 'var(--white)', borderRadius: '2px'
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>Click to upload image</span>
                </div>
              </div>
            </div>
            
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <Button variant="primary" type="button" onClick={() => alert("Product added! (Waiting on Supabase DB connection)")}>Save Product</Button>
            </div>
          </form>
        </div>
      )}

      {/* Product List Mockup */}
      <div className="card" style={{ padding: '2rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--cream-dark)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>
              <th style={{ padding: '1rem 0' }}>PRODUCT</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1 */}
            <tr style={{ borderBottom: '1px solid var(--cream-dark)' }}>
              <td style={{ padding: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--black)', borderRadius: '2px' }}></div>
                  <span style={{ fontWeight: 600 }}>Pistachio Cookie Dough</span>
                </div>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>Cookie</td>
              <td style={{ fontWeight: 600, color: 'var(--choc-mid)' }}>£7.99</td>
              <td><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.6rem', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 600 }}>IN STOCK</span></td>
              <td>
                <button style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              </td>
            </tr>
            {/* Row 2 */}
            <tr style={{ borderBottom: '1px solid var(--cream-dark)' }}>
              <td style={{ padding: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--black)', borderRadius: '2px' }}></div>
                  <span style={{ fontWeight: 600 }}>Rich Fudge Brownie</span>
                </div>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)' }}>Cake</td>
              <td style={{ fontWeight: 600, color: 'var(--choc-mid)' }}>£7.49</td>
              <td><span style={{ background: '#ffebee', color: '#c62828', padding: '0.2rem 0.6rem', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 600 }}>OUT OF STOCK</span></td>
              <td>
                <button style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { createClient } from '../../../utils/supabase/client';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    price: '',
    description: '',
    image_url: '',
    limited_time: false,
    sold_out: false,
    best_consumed_chilled: false,
    badge_text: '',
    ingredients: '',
    weight: '',
    calories: '',
    allergens: [] as string[]
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('categories').select('*');
    const { data: prodData } = await supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false });
    
    if (catData) setCategories(catData);
    if (prodData) setProducts(prodData);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (error) {
      alert(`Upload error: ${error.message}`);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      setFormData({ ...formData, image_url: publicUrl });
    }
    setLoading(false);
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      slug: product.slug,
      category_id: product.category_id,
      price: product.price.toString(),
      description: product.description || '',
      image_url: product.image_url || '',
      limited_time: product.limited_time,
      sold_out: product.sold_out,
      best_consumed_chilled: product.best_consumed_chilled || false,
      badge_text: product.badge_text || '',
      ingredients: product.ingredients || '',
      weight: product.weight || '',
      calories: product.calories || '',
      allergens: product.allergens || []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      badge_text: formData.badge_text || null,
      ingredients: formData.ingredients || null,
      weight: formData.weight || null,
      calories: formData.calories || null,
      allergens: formData.allergens.length > 0 ? formData.allergens : null
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('products').insert([payload]);
      error = err;
    }

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '', slug: '', category_id: '', price: '', description: '', image_url: '',
        limited_time: false, sold_out: false, best_consumed_chilled: false, badge_text: '',
        ingredients: '', weight: '', calories: '', allergens: []
      });
      fetchData();
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>PRODUCTS</h1>
          <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>Manage your inventory and badges.</p>
        </div>
        <Button variant="primary" onClick={() => {
          if (showForm && !editingId) {
            setShowForm(false);
          } else {
            setEditingId(null);
            setFormData({
              name: '', slug: '', category_id: '', price: '', description: '', image_url: '',
              limited_time: false, sold_out: false, badge_text: '',
              ingredients: '', weight: '', calories: '', allergens: []
            });
            setShowForm(true);
          }
        }}>
          {showForm && !editingId ? 'Cancel' : '+ Add New Product'}
        </Button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '2rem', marginBottom: '3rem', borderLeft: '4px solid var(--gold)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            {/* LEFT COLUMN: BASIC INFO & STATUS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Input 
                label="Product Name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input 
                  label="URL Slug" 
                  required 
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                />
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>Category</label>
                  <select 
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    style={{ 
                      width: '100%', padding: '1rem', 
                      border: '1px solid var(--cream-dark)', borderRadius: '2px',
                      fontFamily: 'var(--font-outfit)', fontSize: '1rem'
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
              </div>

              <Input 
                label="Base Price (£)" 
                type="number" 
                step="0.01" 
                required 
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />

              <div style={{ background: 'var(--cream)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--cream-dark)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '1rem', fontWeight: 700 }}>PRODUCT IMAGE</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  {formData.image_url && (
                    <div style={{ 
                      width: '80px', height: '80px', 
                      backgroundImage: `url(${formData.image_url})`, 
                      backgroundSize: 'cover', borderRadius: '4px', border: '1px solid var(--cream-dark)' 
                    }} />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }} />
                </div>
                <Input 
                  label="Manual Image URL" 
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>

              <div style={{ background: 'var(--cream)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--cream-dark)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)', marginBottom: '1rem', fontWeight: 700 }}>BADGES & STATUS</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.limited_time} onChange={(e) => setFormData({...formData, limited_time: e.target.checked})} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>Limited Time</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.sold_out} onChange={(e) => setFormData({...formData, sold_out: e.target.checked})} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>Sold Out</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', gridColumn: '1 / -1' }}>
                    <input type="checkbox" checked={formData.best_consumed_chilled} onChange={(e) => setFormData({...formData, best_consumed_chilled: e.target.checked})} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>Best Consumed Chilled</span>
                  </label>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.4rem' }}>3D STAR BADGE TEXT</label>
                  <input 
                    type="text" 
                    placeholder="e.g. NEW"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({...formData, badge_text: e.target.value})}
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--cream-dark)', background: 'var(--white)', color: 'var(--dark)', borderRadius: '2px' }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CONTENT & NUTRITION */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>Description</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '1rem', border: '1px solid var(--cream-dark)', borderRadius: '2px', fontFamily: 'var(--font-outfit)', fontSize: '1rem' }}
                ></textarea>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>Ingredients List</label>
                <textarea 
                  rows={5}
                  placeholder="Flour, Sugar, Butter..."
                  value={formData.ingredients}
                  onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                  style={{ width: '100%', padding: '1rem', border: '1px solid var(--cream-dark)', borderRadius: '2px', fontFamily: 'var(--font-outfit)', fontSize: '1rem' }}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input label="Weight (e.g. 150g)" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                <Input label="Calories (e.g. 450 kcal)" value={formData.calories} onChange={(e) => setFormData({...formData, calories: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>Allergens</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '1rem', background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: '2px' }}>
                  {['Dairy', 'Nuts', 'Peanuts', 'Gluten', 'Eggs', 'Soya', 'Sesame'].map(allergen => (
                    <label key={allergen} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.allergens.includes(allergen)}
                        onChange={(e) => {
                          const newAllergens = e.target.checked 
                            ? [...formData.allergens, allergen]
                            : formData.allergens.filter(a => a !== allergen);
                          setFormData({ ...formData, allergens: newAllergens });
                        }}
                      />
                      {allergen}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            {/* FULL WIDTH ACTION BUTTONS */}
            <div style={{ 
              gridColumn: '1 / -1', 
              marginTop: '2rem', 
              paddingTop: '2rem', 
              borderTop: '1px solid var(--cream-dark)',
              display: 'flex', 
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              {editingId && (
                <Button variant="outline" type="button" onClick={() => { setEditingId(null); setShowForm(false); }}>
                  Cancel Edit
                </Button>
              )}
              <Button variant="primary" type="submit" disabled={loading} style={{ minWidth: '200px' }}>
                {loading ? 'Saving...' : (editingId ? 'UPDATE PRODUCT' : 'SAVE NEW PRODUCT')}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--cream-dark)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>
              <th style={{ padding: '1rem 0' }}>PRODUCT</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>BADGES</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                <td style={{ padding: '1rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '40px', height: '40px', background: 'var(--black)', borderRadius: '2px',
                      backgroundImage: `url(${product.image_url})`, backgroundSize: 'cover'
                    }}></div>
                    <span style={{ fontWeight: 600 }}>{product.name}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{product.categories?.name}</td>
                <td style={{ fontWeight: 600, color: 'var(--choc-mid)' }}>£{Number(product.price).toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {product.limited_time && <span title="Limited Time" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)' }}></span>}
                    {product.badge_text && <span title={product.badge_text} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--dark)' }}></span>}
                  </div>
                </td>
                <td>
                  <span style={{ 
                    background: product.sold_out ? '#ffebee' : '#e8f5e9', 
                    color: product.sold_out ? '#c62828' : '#2e7d32', 
                    padding: '0.2rem 0.6rem', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 600 
                  }}>
                    {product.sold_out ? 'SOLD OUT' : 'IN STOCK'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleEdit(product)}
                    style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer' }}
                  >Edit</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--grey)' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

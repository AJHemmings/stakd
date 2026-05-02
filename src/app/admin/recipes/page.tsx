"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { createClient } from '../../../utils/supabase/client';

interface Ingredient {
  name: string;
  amount: string;
}

interface Recipe {
  id: string;
  product_id: string;
  product_name: string;
  ingredients: Ingredient[];
}

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Form State
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '' }]);

  const supabase = createClient();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('product_name', { ascending: true });

    if (error) {
      console.error('Error fetching recipes:', error);
    } else if (data) {
      setRecipes(data);
    }
    setLoading(false);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty ingredients
    const validIngredients = ingredients.filter(i => i.name.trim() !== '' && i.amount.trim() !== '');

    if (!productId || !productName) {
      alert("Product ID and Name are required.");
      return;
    }

    const payload = {
      product_id: productId,
      product_name: productName,
      ingredients: validIngredients
    };

    let error;

    if (editingRecipe) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update(payload)
        .eq('id', editingRecipe.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('recipes')
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      alert(`Error saving recipe: ${error.message}`);
    } else {
      alert("Recipe saved successfully!");
      setShowAddForm(false);
      setEditingRecipe(null);
      resetForm();
      fetchRecipes();
    }
  };

  const resetForm = () => {
    setProductId('');
    setProductName('');
    setIngredients([{ name: '', amount: '' }]);
    setEditingRecipe(null);
  };

  const openEditForm = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setProductId(recipe.product_id);
    setProductName(recipe.product_name);
    setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', amount: '' }]);
    setShowAddForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>RECIPES</h1>
          <p style={{ color: 'var(--grey)', fontFamily: 'var(--font-mono)' }}>Manage your filling recipes and ingredient amounts.</p>
        </div>
        <Button variant="primary" onClick={() => {
          if (showAddForm) {
            setShowAddForm(false);
            resetForm();
          } else {
            setShowAddForm(true);
          }
        }}>
          {showAddForm ? 'Cancel' : '+ Add New Recipe'}
        </Button>
      </div>

      {showAddForm && (
        <div className="card" style={{ padding: '2rem', marginBottom: '3rem', borderLeft: '4px solid var(--gold)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
            {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
          </h2>
          <form onSubmit={handleSaveRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>
                  Product ID (e.g. pistachio-cookie-dough)
                </label>
                <input 
                  type="text" 
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  style={{ 
                    width: '100%', padding: '1rem', 
                    border: '1px solid var(--cream-dark)', borderRadius: '2px',
                    fontFamily: 'var(--font-outfit)', fontSize: '1rem'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--grey)', marginBottom: '0.5rem' }}>
                  Product Name (e.g. Pistachio Cookie Dough)
                </label>
                <input 
                  type="text" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  style={{ 
                    width: '100%', padding: '1rem', 
                    border: '1px solid var(--cream-dark)', borderRadius: '2px',
                    fontFamily: 'var(--font-outfit)', fontSize: '1rem'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Ingredients</h3>
              {ingredients.map((ing, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Ingredient Name (e.g. Roasted Pistachios)"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                    style={{ 
                      flex: 2, padding: '0.8rem', 
                      border: '1px solid var(--cream-dark)', borderRadius: '2px',
                      fontFamily: 'var(--font-outfit)'
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder="Amount (e.g. 50g)"
                    value={ing.amount}
                    onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                    style={{ 
                      flex: 1, padding: '0.8rem', 
                      border: '1px solid var(--cream-dark)', borderRadius: '2px',
                      fontFamily: 'var(--font-outfit)'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveIngredient(idx)}
                    style={{ 
                      background: 'none', border: 'none', color: '#c62828', 
                      fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem' 
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddIngredient} style={{ marginTop: '0.5rem' }}>
                + Add Ingredient
              </Button>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <Button variant="primary" type="submit">Save Recipe</Button>
            </div>
          </form>
        </div>
      )}

      {/* Recipe List */}
      <div className="card" style={{ padding: '2rem' }}>
        {loading ? (
          <p style={{ color: 'var(--grey)', textAlign: 'center' }}>Loading recipes...</p>
        ) : recipes.length === 0 ? (
          <p style={{ color: 'var(--grey)', textAlign: 'center' }}>No recipes found. Add one to get started.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {recipes.map((recipe) => (
              <div key={recipe.id} style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.5rem', background: 'var(--white)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{recipe.product_name}</h3>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--grey)' }}>ID: {recipe.product_id}</p>
                  </div>
                  <button 
                    onClick={() => openEditForm(recipe)}
                    style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                </div>
                
                <div style={{ background: 'var(--cream)', padding: '1rem', borderRadius: '2px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--dark)', fontWeight: 600, marginBottom: '0.5rem' }}>INGREDIENTS</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--grey)' }}>
                    {recipe.ingredients.map((ing, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--cream-dark)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                        <span>{ing.name}</span>
                        <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{ing.amount}</span>
                      </li>
                    ))}
                    {recipe.ingredients.length === 0 && (
                      <li style={{ fontStyle: 'italic' }}>No ingredients listed.</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

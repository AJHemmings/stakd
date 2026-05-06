"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, Suspense } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { createClient } from '../../utils/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("Supabase environment variables are not configured yet.");
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        const redirectUrl = searchParams.get('redirect') || '/profile';
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '6rem 2rem', display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {isSignUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--grey)', marginBottom: '2rem' }}>
          {isSignUp 
            ? 'Join the Stak\'d community and earn rewards.' 
            : 'Log in to track your orders and manage your account.'}
        </p>

        {error && (
          <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', marginBottom: '1.5rem', borderRadius: '2px', fontFamily: 'var(--font-outfit)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input 
            label="Email Address" 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input 
            label="Password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <Button variant="primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </Button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--grey)' }}>
          {isSignUp ? 'Already have an account? ' : 'Don\'t have an account? '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '6rem 2rem', textAlign: 'center' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

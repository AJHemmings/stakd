import React from 'react';
import { createClient } from '../../utils/supabase/server';
import { GuestCheckoutGate } from '../../components/checkout/GuestCheckoutGate';
import { AuthenticatedCheckout } from '../../components/checkout/AuthenticatedCheckout';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="container" style={{ padding: '6rem 2rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '3rem', borderBottom: '1px solid var(--cream-dark)', paddingBottom: '1rem' }}>
        CHECKOUT
      </h1>
      
      {user ? (
        <AuthenticatedCheckout user={user} />
      ) : (
        <GuestCheckoutGate />
      )}
    </div>
  );
}

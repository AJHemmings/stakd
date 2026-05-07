import React from 'react';
import { createClient } from '../../utils/supabase/server';
import { createAdminClient } from '../../utils/supabase/admin';
import { redirect } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { ProfileContent } from '../../components/profile/ProfileContent';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) redirect('/login');

  const user = authData.user;

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false });

  return (
    <div className="container" style={{ padding: '6rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--cream-dark)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)' }}>MY ACCOUNT</h1>
        <form action="/auth/signout" method="post">
          <Button variant="outline" type="submit">Sign Out</Button>
        </form>
      </div>

      <ProfileContent
        user={{ email: user.email! }}
        initialOrders={orders ?? []}
      />
    </div>
  );
}

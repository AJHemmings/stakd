import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7)); // Monday
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = createAdminClient();

  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase.from('orders').select('id, created_at, total_amount, customer_email').order('created_at', { ascending: true }),
    supabase.from('order_items').select('order_id, product_name, quantity, unit_price'),
  ]);

  if (!orders) return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });

  // --- Time-series aggregation ---
  const daily: Record<string, { revenue: number; orders: number }> = {};
  const weekly: Record<string, { revenue: number; orders: number }> = {};
  const monthly: Record<string, { revenue: number; orders: number }> = {};
  const yearly: Record<string, { revenue: number; orders: number }> = {};

  orders.forEach(o => {
    const d = new Date(o.created_at);
    const amount = Number(o.total_amount);

    const dayKey = d.toISOString().slice(0, 10);
    const weekKey = getWeekStart(d);
    const monthKey = d.toISOString().slice(0, 7);
    const yearKey = String(d.getFullYear());

    const add = (map: typeof daily, key: string) => {
      if (!map[key]) map[key] = { revenue: 0, orders: 0 };
      map[key].revenue += amount;
      map[key].orders += 1;
    };
    add(daily, dayKey);
    add(weekly, weekKey);
    add(monthly, monthKey);
    add(yearly, yearKey);
  });

  const toArray = (map: Record<string, { revenue: number; orders: number }>) =>
    Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, v]) => ({ label, ...v }));

  // --- Last 30 days / 12 weeks / 12 months (fill gaps with zeros) ---
  const now = new Date();

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return { label: key.slice(5), ...(daily[key] || { revenue: 0, orders: 0 }) };
  });

  const last12Weeks = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (11 - i) * 7);
    const key = getWeekStart(d);
    const label = `${key.slice(5, 7)}/${key.slice(8, 10)}`;
    return { label, ...(weekly[key] || { revenue: 0, orders: 0 }) };
  });

  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    return { label, ...(monthly[key] || { revenue: 0, orders: 0 }) };
  });

  const allYears = toArray(yearly);

  // --- Product insights ---
  const productRevenue: Record<string, { quantity: number; revenue: number }> = {};
  items?.forEach(item => {
    const name = item.product_name;
    if (!productRevenue[name]) productRevenue[name] = { quantity: 0, revenue: 0 };
    productRevenue[name].quantity += item.quantity;
    productRevenue[name].revenue += item.quantity * Number(item.unit_price);
  });

  const productList = Object.entries(productRevenue)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const uniqueCustomers = new Set(orders.map(o => o.customer_email)).size;

  return NextResponse.json({
    daily: last30Days,
    weekly: last12Weeks,
    monthly: last12Months,
    yearly: allYears,
    products: productList,
    totalRevenue,
    totalOrders: orders.length,
    avgOrderValue,
    uniqueCustomers,
  });
}

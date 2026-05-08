import { NextResponse } from 'next/server';
import { getWelcomeEmailHtml, getOrderConfirmationHtml, getShippingUpdateHtml } from '@/utils/email';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'welcome';
  const name = searchParams.get('name') || 'Legendary Customer';

  let html = '';

  if (type === 'welcome') {
    html = getWelcomeEmailHtml(name);
  } else if (type === 'order') {
    html = getOrderConfirmationHtml(name, 'PREVIEW-123', [
      { name: 'Dark Choc Sea Salt', quantity: 2, base: 'Dark', price: 4.50 },
      { name: 'Milk Choc Hazelnut', quantity: 1, base: 'Milk', price: 4.50 }
    ], 13.50);
  } else if (type === 'shipping') {
    html = getShippingUpdateHtml(name, 'PREVIEW-123', 'GB123456789RM');
  }

  return NextResponse.json({ html });
}

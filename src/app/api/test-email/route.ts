import { NextResponse } from 'next/server';
import { sendWelcomeEmail, sendOrderConfirmationEmail, sendShippingUpdateEmail } from '@/utils/email';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'welcome';

  if (!email) {
    return NextResponse.json({ error: 'Please provide an email parameter: ?email=your@email.com' }, { status: 400 });
  }

  try {
    if (type === 'welcome') {
      await sendWelcomeEmail(email, 'Test User');
    } else if (type === 'order') {
      await sendOrderConfirmationEmail(email, 'Test User', 'TEST-123', [
        { name: 'Dark Choc Sea Salt', quantity: 2, base: 'Dark', price: 4.50 },
        { name: 'Milk Choc Hazelnut', quantity: 1, base: 'Milk', price: 4.50 }
      ], 13.50);
    } else if (type === 'shipping') {
      await sendShippingUpdateEmail(email, 'Test User', 'TEST-123', 'GB123456789RM');
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test ${type} email sent to ${email}. Check your inbox (and spam folder)!` 
    });
  } catch (error: any) {
    console.error('Test email failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

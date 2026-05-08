import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '../../../../utils/email';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await sendWelcomeEmail(email, name);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in welcome API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

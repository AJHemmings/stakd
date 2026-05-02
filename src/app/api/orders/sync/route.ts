import { NextResponse } from 'next/server';
import { syncOrderToSheets } from '../../../../utils/google-sheets';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, customerName, total, status, items } = body;

    const response = await syncOrderToSheets({
      orderId,
      customerName,
      total,
      status,
      items: items.map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        base: i.baseName
      }))
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Google Sheets credentials are not configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Error syncing to Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

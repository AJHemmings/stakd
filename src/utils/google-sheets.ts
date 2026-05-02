import { google } from 'googleapis';

export async function syncOrderToSheets(orderData: {
  orderId: string;
  customerName: string;
  total: number;
  status: string;
  items: { name: string; quantity: number; base: string }[];
}) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.warn('Google Sheets credentials are not configured. Skipping sync.');
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Format the items into a single string for the sheet
    const itemsString = orderData.items.map((i: any) => `${i.quantity}x ${i.name} (${i.base})`).join(', ');
    
    // Get the current date
    const date = new Date().toLocaleString('en-GB');

    // Append a row to the "Orders" sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Orders!A:F', // Assuming columns: A=Date, B=OrderID, C=Customer, D=Items, E=Total, F=Status
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [date, orderData.orderId, orderData.customerName, itemsString, `£${orderData.total}`, orderData.status]
        ],
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    throw error;
  }
}

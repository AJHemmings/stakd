import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const FROM_EMAIL = 'STAK\'D <hello@stakdbars.com>';

const BASE_STYLE = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #1a110e;
  line-height: 1.6;
  background-color: #fdfaf6;
  margin: 0;
  padding: 0;
`;

const CONTAINER_STYLE = `
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  background-color: #ffffff;
`;

const HEADER_STYLE = `
  text-align: center;
  padding-bottom: 40px;
  border-bottom: 1px solid #f0e6d2;
`;

const LOGO_STYLE = `
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #1a110e;
  text-transform: uppercase;
  text-decoration: none;
`;

const FOOTER_STYLE = `
  text-align: center;
  padding-top: 40px;
  border-top: 1px solid #f0e6d2;
  font-size: 12px;
  color: #a0a0a0;
  margin-top: 40px;
`;

const BUTTON_STYLE = `
  display: inline-block;
  background-color: #1a110e;
  color: #fdfaf6;
  padding: 15px 30px;
  text-decoration: none;
  border-radius: 2px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.05em;
  margin: 20px 0;
`;

function wrapTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <body style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <div style="${HEADER_STYLE}">
            <a href="https://stakdbars.com" style="${LOGO_STYLE}">STAK'D</a>
          </div>
          <div style="padding: 40px 0;">
            ${content}
          </div>
          <div style="${FOOTER_STYLE}">
            <p>&copy; ${new Date().getFullYear()} STAK'D CHOCOLATE. ALL RIGHTS RESERVED.</p>
            <p>You received this email because you made a purchase or signed up at stakdbars.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/* --- HTML Generators --- */

export function getWelcomeEmailHtml(name?: string) {
  // Always use the production URL for images so they load in external email clients
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stakdbars.com';
  const heroImageUrl = `${baseUrl}/welcome-hero.jpg`;

  return wrapTemplate(`
    <h1 style="font-size: 24px; margin-bottom: 20px;">WELCOME TO THE CLUB, YOU LEGEND!</h1>
    <p>Thanks for joining STAK'D. You're now a legendary part of a community that doesn't settle for average.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <img src="${heroImageUrl}" alt="STAK'D vs Competitors" style="width: 100%; max-width: 450px; border-radius: 4px;" />
    </div>

    <p>As a member, you'll take part in the rewards scheme and get exclusive access to new products.</p>
    <p style="font-weight: bold; color: #d4af37; font-size: 1.1rem; margin-top: 20px;">IT'S TIME TO GET STAK'D.</p>
    
    <a href="https://stakdbars.com/profile" style="${BUTTON_STYLE}">View Your Profile</a>
    <p style="margin-top: 30px;">Stay stak'd,<br>The STAK'D Team</p>
  `);
}

export function getOrderConfirmationHtml(name: string, orderRef: string, items: any[], total: number) {
  const itemsHtml = items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #f0e6d2; padding-bottom: 10px;">
      <span>${item.quantity}x ${item.name} (${item.base})</span>
      <span style="font-weight: bold;">£${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  return wrapTemplate(`
    <h1 style="font-size: 24px; margin-bottom: 20px;">ORDER CONFIRMED</h1>
    <p>Hi ${name},</p>
    <p>We've received your order <strong>#${orderRef}</strong> and we're getting it ready to be overfilled for you.</p>
    
    <div style="background-color: #fdfaf6; padding: 20px; border-radius: 4px; margin: 30px 0;">
      <h3 style="margin-top: 0; font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.1em;">Order Summary</h3>
      ${itemsHtml}
      <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 18px; font-weight: bold;">
        <span>Total</span>
        <span style="color: #d4af37;">£${total.toFixed(2)}</span>
      </div>
    </div>

    <p>We'll notify you as soon as your bars are on their way to you.</p>
    <a href="https://stakdbars.com/profile" style="${BUTTON_STYLE}">Track Your Order</a>
  `);
}

export function getShippingUpdateHtml(name: string, orderRef: string, trackingNumber: string) {
  const trackingUrl = `https://www.royalmail.com/track-your-item?trackNumber=${trackingNumber}`;

  return wrapTemplate(`
    <h1 style="font-size: 24px; margin-bottom: 20px;">YOUR BARS ARE EN ROUTE!</h1>
    <p>Hi ${name},</p>
    <p>Great news! Your STAK'D order <strong>#${orderRef}</strong> has been shipped and is heading your way.</p>
    <p>Expect to receive your package within 1-2 business days, unless Royal Mail are on strike,lol.</p>
    
    <div style="background-color: #fdfaf6; padding: 20px; border-radius: 4px; margin: 30px 0; text-align: center;">
      <p style="margin-top: 0; font-size: 12px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.1em;">Royal Mail Tracking</p>
      <p style="font-size: 20px; font-weight: bold; margin: 10px 0;">${trackingNumber}</p>
      <a href="${trackingUrl}" style="${BUTTON_STYLE}">Track Your Delivery</a>
    </div>

    <p>If you have any questions, just reply to this email.</p>
    <p>Enjoy the stak!</p>
  `);
}

/* --- Sending Functions --- */

export async function sendWelcomeEmail(email: string, name?: string) {
  const html = getWelcomeEmailHtml(name);
  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to STAK\'D',
    html,
  });
}

export async function sendOrderConfirmationEmail(email: string, name: string, orderRef: string, items: any[], total: number) {
  const html = getOrderConfirmationHtml(name, orderRef, items, total);
  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Order Confirmed: #${orderRef}`,
    html,
  });
}

export async function sendShippingUpdateEmail(email: string, name: string, orderRef: string, trackingNumber: string) {
  const html = getShippingUpdateHtml(name, orderRef, trackingNumber);
  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Shipping Update: Order #${orderRef}`,
    html,
  });
}

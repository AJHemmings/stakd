# STAK'D — Handover Document
_Last updated: 7 May 2026 (session 3)_

---

## Current State

The site is **fully operational end-to-end**. Orders flow from Stripe checkout through the webhook into Supabase — including full shipping address capture — and appear in the admin dashboard with correct labels. The support ticket system is live with two-way messaging, unread notification dots on both sides, and error handling. Cart interaction no longer uses browser alerts.

---

## What Was Done This Session (7 May 2026)

### Shipping Address
- **Webhook fixed** — Stripe API version `2026-04-22.dahlia` puts shipping data in `collected_information.shipping_details.address`, not the top-level `shipping_details`. Webhook now reads both with fallback.
- **Address formatting** — Full multi-line address (line1, line2, city, state, postal_code, country). `whiteSpace: pre-wrap` on all address displays.
- **CSV export fixed** — Was splitting a formatted string by comma (broken). Now reads raw address fields directly — includes Address 2 and Country columns.
- **Mock orders removed** — Stale `MOCK_ORDERS` array cleaned from the admin orders page.

### Support System
- **Tables created** — `support_tickets` and `support_messages` tables added to Supabase. SQL in the "Supabase Schema" section below.
- **Admin send error** — Previously silent when API call failed. Now surfaces the actual error message in the panel above the reply box.
- **Unread notification dots** — Orange dot appears on ticket rows (admin) and ticket cards (customer) when there's an unread message. Clears when the thread is opened. Backed by `unread_by_admin` and `unread_by_customer` columns on `support_tickets`.
  - Customer replies → `unread_by_admin = true`
  - Admin replies → `unread_by_customer = true`
  - Opening thread on either side → clears their flag

### Cart & Product Pages
- **Removed `alert()`** — "Added to basket!" browser popup replaced with button state: turns gold and shows "Added ✓" for 1.5 seconds.
- **Cart count animation** — Navbar "Cart (n)" text does a quick bounce when count increases (`cart-bump` keyframe in globals.css).

### Success Page
- **RLS fix** — Was querying Supabase directly with the anon key (406 error). Now calls `/api/orders/confirmation?session_id=` which uses `createAdminClient()` server-side.

### Session 2 Work (also 7 May 2026)
- **Stripe webhook tested end-to-end** — Full order flow confirmed working.
- **Stripe CLI** — Binary at `C:\Users\ajhem\AppData\Local\Microsoft\WinGet\Links\stripe.exe` (not on PATH). Webhook secret in `.env.local`. Only needed locally — production Vercel receives webhooks directly.
- **Checkout flow** — Logged-in users skip the interstitial and go straight to Stripe. Account email pre-filled so `customer_email` always matches.
- **Admin orders page** — Uses `/api/admin/orders` route with `createAdminClient()`. All read/write ops work.
- **Profile page** — Active/History split. Collapsible order rows. Uses `createAdminClient()` to bypass RLS.
- **Admin Insights page** (`/admin/insights`) — Revenue bar chart (Daily/Weekly/Monthly/Yearly), KPI cards, product performance table. No chart library.
- **Support ticket system** — Full two-way messaging. OPEN → IN_PROGRESS on first admin reply. Customer reply re-opens RESOLVED tickets.

---

## Starting the Dev Environment

### Start webhook listener (must be in a new cmd terminal, not PowerShell)
```
"C:\Users\ajhem\AppData\Local\Microsoft\WinGet\Links\stripe.exe" listen --forward-to localhost:3000/api/webhooks/stripe
```

### Start dev server (separate terminal)
```
npm run dev
```

### Test purchase card
`4242 4242 4242 4242` — any future expiry, any CVC

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhook — writes orders to Supabase via admin client |
| `src/app/api/checkout/route.ts` | Creates Stripe checkout session, pre-fills `customer_email` for logged-in users |
| `src/app/api/admin/orders/route.ts` | Admin orders API — GET all orders, PATCH status/batch via admin client |
| `src/app/api/admin/insights/route.ts` | Aggregates sales data by day/week/month/year + product stats |
| `src/app/api/support/route.ts` | Customer: list own tickets, create ticket |
| `src/app/api/support/[id]/route.ts` | Customer: get thread, post reply |
| `src/app/api/admin/support/route.ts` | Admin: list all tickets, update status/notes |
| `src/app/api/admin/support/[id]/route.ts` | Admin: get thread, post reply |
| `src/utils/supabase/admin.ts` | `createAdminClient()` — service role, bypasses RLS |
| `src/components/profile/ProfileContent.tsx` | Client component managing orders + support state on profile page |
| `src/components/profile/OrderList.tsx` | Collapsible order rows with inline support ticket form |
| `src/app/admin/support/page.tsx` | Admin support dashboard with two-way chat |
| `src/app/admin/insights/page.tsx` | Revenue charts + product performance |
| `src/app/api/orders/confirmation/route.ts` | Fetches order by Stripe session ID for success page (admin client) |

---

## Supabase Schema

```
orders          — id, stripe_session_id, customer_name, customer_email,
                  shipping_address (JSONB), total_amount, payment_status,
                  fulfillment_status, notes, batch_id

order_items     — id, order_id, product_name, base_name, quantity, unit_price

products        — id, name, price, description, image_url, ingredients, weight,
                  calories, allergens (TEXT[]), badge_text, sold_out

support_tickets — id, created_at, order_id, order_reference, customer_email,
                  message, status (OPEN/IN_PROGRESS/RESOLVED), admin_notes,
                  unread_by_admin (bool), unread_by_customer (bool)

support_messages — id, created_at, ticket_id, author (customer/admin), message
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — bypasses RLS, server-side only |
| `STRIPE_SECRET_KEY` | Stripe sandbox secret key (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe sandbox publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` output (`whsec_...`) — set in `.env.local` |
| `RESEND_API_KEY` | Email sending — placeholder, not yet configured |

---

## Technical Debt / Known Issues

- **Resend not configured** — `RESEND_API_KEY` is a placeholder. Support ticket replies have no email notification. Next step before going live.
- **Google Sheets sync** — `/api/orders/sync/route.ts` exists but has never been tested end-to-end.
- **No INSERT RLS on orders** — Intentional. Webhook uses service role. Do not add an open INSERT policy.
- **Stripe CLI not on PATH** — Dev only. Use full path `C:\Users\ajhem\AppData\Local\Microsoft\WinGet\Links\stripe.exe`. Not needed in production.

---

## Future Feature: AI Chat Support Agent

### What it would do
Replace or augment the manual support ticket system with an AI assistant that can answer common customer questions instantly — order status, ingredients, delivery estimates, return policy — without requiring admin involvement. Unresolved queries escalate to a real support ticket.

### Recommended approach
Use the **Vercel AI SDK** (`ai` package) with **Claude** as the model provider. The agent would have access to a small set of tools:

| Tool | What it does |
|------|-------------|
| `getOrderStatus(email)` | Queries Supabase for the customer's active orders and fulfillment status |
| `getProductInfo(productName)` | Returns ingredients, allergens, calories for a given product |
| `createSupportTicket(orderId, message)` | Escalates to a real ticket when the AI can't resolve the issue |

### Architecture
- **API route**: `POST /api/chat` — uses Vercel AI SDK `streamText()` with tool definitions. Server-side only; the Supabase admin client queries live data.
- **UI**: A floating chat widget (bottom-right) rendered client-side using the AI SDK's `useChat()` hook. Available on the profile page and product pages.
- **Auth context**: Pass the logged-in user's email to the API route so `getOrderStatus` can filter correctly. Guest users get a limited version (no order lookup).

### What to install
```
npm install ai @anthropic-ai/sdk
```

### Env vars needed
No provider API key needed — auth is handled via Vercel OIDC. Run `vercel env pull` to get credentials. The gateway handles routing to Anthropic automatically.

### Rough implementation sketch
```typescript
// src/app/api/chat/route.ts
import { streamText } from 'ai';
import { gateway } from '@ai-sdk/vercel';

export async function POST(req: Request) {
  const { messages, userEmail } = await req.json();

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4.6'),
    system: `You are a friendly support agent for STAK'D, a custom chocolate bar business.
             You help customers with order tracking, product info, and general queries.
             If you cannot resolve an issue, use the createSupportTicket tool.`,
    messages,
    tools: { getOrderStatus, getProductInfo, createSupportTicket },
  });

  return result.toUIMessageStreamResponse();
}
```

### Considerations before building
- **Cost** — Every chat message calls the Claude API. Set a max message limit per session to avoid abuse.
- **Scope creep** — Define what the AI can and cannot do before building. Start narrow: order status + FAQ only.
- **Fallback** — Always offer "talk to a human" which creates a real support ticket.
- **Testing** — The AI SDK's `generateText()` (non-streaming) is easier to test; use it in development.

---

## Previous Session Work (6 May 2026)
- **Database Integration** — Replaced all mock data with live Supabase queries.
- **Admin Product Dashboard** — Fully wired up `/admin/products`. Includes Create, Update, and List.
- **Image Upload Utility** — Direct file uploads to Supabase Storage (`product-images` bucket).
- **Ingredients & Nutrition System** — Glass-morphism modal for Ingredients, Weight, Calories, Allergen tags.
- **3D Product Badges** — Circular 3D-pop style badges (e.g., "NEW") on product cards.
- **Stripe Build Fix** — Switched from deprecated `redirectToCheckout` to server-side URL redirect.
- **Security (RLS)** — Configured Row Level Security for `products` table and Storage buckets.

---

## Repo
- GitHub: https://github.com/AJHemmings/stakd
- Branch: `master`
- Deploys automatically to Vercel on push to `master`

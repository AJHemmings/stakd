# STAK'D — Database Schema

Reference for the live Supabase project (`xjvppwgeatqsnnmrkfls`, eu-west-1).
Captured 4 August 2026. Row counts are from that date and will drift.

> **Read this, not `supabase/migrations/`.** That directory holds two files and
> describes five of the sixteen tables below. Everything marked **⚠ no migration**
> was created directly in the Supabase dashboard and exists in no SQL file in this
> repo — the repo cannot rebuild the database from scratch. Fixing that means
> dumping the live schema into a baseline migration; until then, this document is
> the source of truth.

RLS is enabled on all sixteen tables. Note that most server code reaches for
`createAdminClient()` (service role), which bypasses RLS entirely — so the
policies rarely apply in practice.

---

## Storefront

### `products` — 5 rows
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `category_id` | uuid | → `categories.id`, nullable |
| `name` | text | |
| `slug` | text | unique |
| `description` | text | nullable |
| `price` | numeric | **the full price of the item** — see note below |
| `image_url` | text | nullable |
| `ingredients` | text | nullable |
| `weight` | text | nullable |
| `calories` | text | nullable |
| `allergens` | text[] | nullable |
| `limited_time` | bool | default `false` |
| `sold_out` | bool | default `false` |
| `badge_text` | text | nullable |
| `chocolate_id` | uuid | → `chocolates.id`, nullable |
| `filling_id` | uuid | → `fillings.id`, nullable |
| `shell_weight_g` | int | default `0` |
| `best_consumed_chilled` | bool | default `false` |
| `created_at` | timestamptz | default `now()` |

**There is no `bases` table.** The cart carries `baseId` / `baseName`
(`src/store/cart.ts`) but nothing in the database prices a base — `products.price`
is the whole price. Any server-side price lookup is a single read from `products`
keyed on `productId`.

### `categories` — 3 rows
`id` (uuid, PK) · `name` · `slug` (unique) · `description?` · `image_url?` · `created_at`

### `chocolates` — 3 rows ⚠ no migration
`id` (uuid, PK) · `name` · `cocoa_percent?` (int) · `ingredients?` · `allergens?` (text[]) · `calories_per_100g?` (int) · `created_at`

### `fillings` — 1 row ⚠ no migration
`id` (uuid, PK) · `name` · `ingredients?` · `allergens?` (text[]) · `calories?` · `weight?` · `created_at`

### `recipes` — 0 rows ⚠ no migration
`id` (uuid, PK) · `product_id` (text, unique) · `product_name` · `ingredients` (jsonb, default `[]`) · `created_at` · `updated_at`

---

## Orders

### `orders` — 3 rows
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | → `auth.users.id`, nullable. **The webhook never sets this** — loyalty is keyed on `customer_email` so guest checkout works. Consequence: the "users can view their own orders" RLS policy matches nothing. |
| `customer_name` | text | nullable |
| `customer_email` | text | nullable |
| `shipping_address` | jsonb | nullable |
| `total_amount` | numeric | |
| `payment_status` | text | default `'pending'` |
| `fulfillment_status` | text | default `'RECEIVED'` |
| `notes` | text | nullable |
| `batch_id` | text | nullable |
| `stripe_session_id` | text | **UNIQUE — this is the webhook idempotency guard against Stripe retries. Do not drop it.** |
| `tracking_number` | text | nullable |
| `created_at` | timestamptz | default `now()` |

### `order_items` — 3 rows
`id` (uuid, PK) · `order_id` → `orders.id` · `product_name` · `base_name?` · `quantity` (int) · `unit_price` (numeric)

---

## Accounts

### `profiles` — 0 rows
`id` (uuid, PK, → `auth.users.id`) · `full_name?` · `email?` (unique) · `shipping_address?` (jsonb) · `role?` (text, default `'user'`) · `created_at`

**Empty.** No user has a profile row, so `profiles.role` cannot currently be used
to gate admin access without a backfill first. Admin role today lives in
`user_metadata` (`src/app/admin/layout.tsx`), which the user can write themselves.

---

## Vouchers & loyalty

### `voucher_codes` — 1 row ⚠ no migration
`id` (uuid, PK) · `code` (unique) · `name` · `description?` · `discount_type` · `discount_value` (numeric) · `expires_at?` · `max_uses?` (int) · `uses_count?` (int, default `0`) · `one_per_customer` (bool, default `false`) · `is_active?` (bool, default `true`) · `created_at`

`discount_type` is CHECK-constrained to: `percentage` · `fixed` · `free_delivery` · `one_pound_delivery`

### `voucher_redemptions` — 0 rows ⚠ no migration
`id` (uuid, PK) · `voucher_code_id` → `voucher_codes.id` · `customer_email` · `created_at`

### `reward_tiers` — 10 rows ⚠ no migration
`id` (uuid, PK) · `name` · `description?` · `order_milestone` (int, unique) · `reward_type?` · `free_item_product_id?` → `products.id` · `sort_order?` (int, default `0`) · `is_active?` (bool, default `true`)

`reward_type` is CHECK-constrained to: `free_delivery` · `percent_10` · `percent_20` · `free_item`

### `user_rewards` — 0 rows ⚠ no migration
`id` (uuid, PK) · `user_email` (text) · `tier_id?` → `reward_tiers.id` · `earned_at` · `redeemed_at?` · `is_redeemed?` (bool, default `false`)

Keyed on **email**, not `user_id` — this is what makes loyalty work for guest checkout.

---

## Shipping config

### `shipping_tiers` — 3 rows ⚠ no migration
`id` (uuid, PK) · `label` · `min_items` (int) · `max_items?` (int, null = open-ended) · `price_pence` (int) · `sort_order` (int, default `0`) · `is_active` (bool, default `true`) · `created_at`

### `store_settings` — 1 row ⚠ no migration
`key` (text, **PK**) · `value` (text) · `label` (text) · `updated_at`

Holds `free_delivery_threshold_gbp` (default `45`). Values are stored as text — the
checkout route parses with `parseFloat`.

---

## Support

### `support_tickets` — 0 rows ⚠ no migration
`id` (uuid, PK) · `order_id?` → `orders.id` · `order_reference?` · `customer_email` · `message` · `status?` (default `'OPEN'`) · `admin_notes?` · `unread_by_admin?` (bool, default `false`) · `unread_by_customer?` (bool, default `false`) · `created_at`

Status flow: `OPEN` → `IN_PROGRESS` (first admin reply) → `RESOLVED`. A customer
reply re-opens a `RESOLVED` ticket.

### `support_messages` — 0 rows ⚠ no migration
`id` (uuid, PK) · `ticket_id` → `support_tickets.id` · `author` (`customer` | `admin`) · `message` · `created_at`

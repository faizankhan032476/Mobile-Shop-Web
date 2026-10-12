# Database documentation

PostgreSQL on Supabase. Run migrations in order: `0001_schema` → `0002_rls` → `0003_functions` → `0004_storage` → `seed.sql`.

## Tables
| Table | Purpose | Notes |
|---|---|---|
| `categories`, `brands` | Reusable taxonomy | `slug` unique. Products reference them with `ON DELETE RESTRICT`. |
| `products` | Catalog | Integer PKR `price`, optional `compare_at_price ≥ price`, `colors` jsonb `[{name,hex}]`, `storage_options text[]`, `specs` jsonb, `images text[]` (Storage paths or https URLs), `stock ≥ 0`, `is_published/featured/on_sale/is_demo`, `popularity`, `rating`, `review_count` (kept in sync by trigger from `product_reviews`). |
| `profiles` | One row per `auth.users` row (created by trigger) | `role` = `customer` (default) or `admin`. Credentials stay in Supabase Auth. |
| `addresses` | Saved customer addresses | Owner-only RLS. |
| `orders` | Orders | `user_id` null for guests; guests get a secret `guest_token`. `idempotency_key` unique. Check constraints: `total = subtotal - discount_amount + shipping_cost`; guest/user exclusivity. Shipping address stored as a JSON snapshot. `payment_method` currently limited to `cod`. |
| `order_items` | Line items | Snapshot of name, SKU, color, storage, unit price. `product_id` is `ON DELETE SET NULL` so history survives product deletion/edits. |
| `order_status_history` | Audit trail | Written by DB functions only. |
| `product_reviews` | Reviews | Insert allowed only for customers with a *delivered* order containing the product; one per user per product. |
| `discount_codes` | Percentage codes | Admin-only table; used through server functions. `used_count` increments inside order creation. |
| `store_settings` | Key/value | `free_shipping_threshold`, `flat_shipping`, `store_name`. |

## Security model (defence in depth)
1. **Grants:** `anon` and `authenticated` start with *no* privileges; only what the app needs is granted (e.g. `update (full_name, phone)` on `profiles`, so `role` can't be written by the API).
2. **RLS** is enabled on every table. Public: read published products, categories, brands, settings, reviews. Customers: own profile/addresses/orders only. Admin (`public.is_admin()`): manage catalog, settings, discount codes; read all orders.
3. **Orders can't be written directly.** There are no INSERT/UPDATE policies on `orders`/`order_items`; clients call `create_order()` (a `SECURITY DEFINER` function with a pinned `search_path`) which validates everything and prices from the database. `admin_set_order_status()`, `admin_adjust_stock()` and `admin_dashboard_stats()` check `is_admin()` internally.
4. **Role changes:** blocked by column grants *and* a trigger (`block_role_change`) for any request that carries a user identity. Only trusted SQL (SQL Editor) can promote an admin.
5. **Storage:** `product-images` bucket is public-read; insert/update/delete policies require `is_admin()`. Size and MIME limits are set on the bucket and re-checked in the API.
6. **Function execute rights** are revoked from `PUBLIC` and re-granted individually; internal helpers (`_price_cart`, `_order_json`) are not callable by clients.

## Concurrency & inventory
`create_order` takes a transaction-level advisory lock on the idempotency key (serialises double submits), locks the involved product rows `FOR UPDATE` in a fixed order (no deadlocks), re-checks stock, then decrements. `CHECK (stock >= 0)` is the last line of defence. Cancelling restocks once (`orders.stock_restored`).

## Making changes
Add a new numbered file in `supabase/migrations/`; never edit applied ones. After adding a table, immediately `enable row level security`, add policies, and grant the minimum. Regenerate the demo seed with `npm run seed:generate` after changing `data/products.ts`.

# API Documentation

Base URL: your site (e.g. `http://localhost:3000`). All bodies are JSON unless stated. Money is whole **PKR integers**.

**Auth model.** Sign-in uses Supabase Auth with httpOnly session cookies set by server actions (`app/auth/actions.ts`). Every API route builds a Supabase client from those cookies, so every query runs *as that user* and Row Level Security applies. Admin routes additionally call `requireAdmin()`, which reads `profiles.role` from the database for the verified user. Nothing in the request (body, header, URL) can set a role.

**Errors** always look like:
```json
{ "error": { "code": "VALIDATION", "message": "Please fix the highlighted fields.", "fields": { "customer.phone": "Enter a Pakistani mobile number…" } } }
```
| Status | Codes |
|---|---|
| 400 | `VALIDATION`, `BAD_JSON`, `INVALID_CART`, `INVALID_DISCOUNT`, `INVALID_CUSTOMER`, `INVALID_SHIPPING`, `PAYMENT_METHOD_UNSUPPORTED`, `INVALID_DELTA`, `CONSTRAINT` |
| 401 | `UNAUTHENTICATED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND`, `ORDER_NOT_FOUND`, `PRODUCT_NOT_FOUND` |
| 409 | `INSUFFICIENT_STOCK`, `PRODUCT_UNAVAILABLE`, `INVALID_VARIANT`, `INVALID_TRANSITION`, `DUPLICATE`, `IN_USE` |
| 413 | `TOO_LARGE` |
| 500 / 503 | `SERVER_ERROR` (generic, no internals leaked) / `NOT_CONFIGURED` |

## Public catalog

### `GET /api/products`
Query: `q` (name, SKU or brand), `category` (slug), `brand` (slug), `sale=1`, `inStock=1`, `featured=1`, `minPrice`, `maxPrice`, `sort` = `popular|newest|price-asc|price-desc|rating`, `page` (≥1), `pageSize` (1–100, default 24), `includeUnpublished=1` (honoured **only** for admins).
Returns `{ data: Product[], page, pageSize, total }`. Only published products are returned to the public (enforced by RLS too).

### `GET /api/products/{idOrSlug}`  → `{ data: Product }` or 404
### `GET /api/categories`, `GET /api/brands` → `{ data: [{ slug, name, … }] }`

`Product`: `id, slug, sku, name, brand, category, price, originalPrice?, stock, rating, reviewCount, popularity, createdAt, featured, onSale, published, colors[{name,hex}], storage[], description, specs{}, images[] (URLs), imagePaths[], imageUrl?`

## Cart pricing and orders

### `POST /api/quote`
Body: `{ items: [{ productId (uuid), color, storage, quantity 1–10 }] (1–20 items), discountCode? }`
Returns `{ data: { subtotal, discount, shipping, total, discountCode } }`, calculated by the database from current prices, stock and store settings. Errors: `INVALID_CART`, `PRODUCT_UNAVAILABLE`, `INVALID_VARIANT`, `INSUFFICIENT_STOCK`, `INVALID_DISCOUNT`.

### `POST /api/orders`
Guests and signed-in customers. Body:
```json
{ "idempotencyKey": "chk_<16-64 chars [A-Za-z0-9_-]>", "paymentMethod": "cod",
  "items": [{ "productId": "…", "color": "Black", "storage": "256GB", "quantity": 1 }],
  "discountCode": "ORBIT5",
  "customer": { "name": "…", "email": "…", "phone": "0300 1234567" },
  "shipping": { "address": "…", "city": "…", "postalCode": "54000" } }
```
Prices/totals are **never** accepted from the client. In one database transaction the server locks the product rows, validates stock/variants, computes totals, creates the order and items (with name/SKU/price snapshots), decrements stock, and records history.
Returns `201 { data: { id, orderNumber, guestToken, total, duplicate:false } }`. Repeating the same `idempotencyKey` returns `200` with `duplicate:true` and the original order (no second order, no second stock deduction). `guestToken` is `null` for signed-in users; for guests it is the secret needed to read the order again (the website stores it in the browser).
Only `paymentMethod: "cod"` is accepted. Stock is **reserved at order time** and returned if an admin cancels.

### `GET /api/orders`  (signed in) → the caller's own orders
### `GET /api/orders/{id}`
Owner (session) **or** guest with header `x-order-token: <guestToken>`. Anything else returns the same `404` whether or not the order exists.

## Account
### `GET /api/me` → `{ data: { id, email, fullName, phone, role } | null }`
### `PATCH /api/me`  `{ fullName, phone? }` (`03XXXXXXXXX`). Only these two columns are writable; `role` is not.

Auth flows (register, login, logout, forgot/reset password) are Next.js **server actions** in `app/auth/actions.ts` rendered by `/register`, `/login`, `/forgot-password`, `/reset-password`; `GET /auth/callback` exchanges email-link codes for a session (redirect targets are restricted to same-site paths).

## Admin (all require a signed-in admin; otherwise 401/403)

| Method & path | Purpose |
|---|---|
| `POST /api/admin/products` | Create product. Body: `name, sku, brandSlug, categorySlug, description, price, originalPrice?, stock, colors[], storage[], specs{}, images[] (stored paths), published, featured, onSale, slug?` |
| `PATCH /api/admin/products/{id}` | Replace product fields (same body). |
| `DELETE /api/admin/products/{id}` | Delete product; past orders keep their snapshots. Also removes its Storage images. |
| `POST /api/admin/products/{id}/stock` | `{ delta }` atomic relative change (≠0, result can't go below 0). Returns `{ data: { stock } }`. |
| `POST /api/admin/products/{id}/images` | `multipart/form-data` field `file`. JPEG/PNG/WebP/AVIF ≤5 MB, type verified from file bytes, server-generated name, max 10 per product. |
| `DELETE /api/admin/products/{id}/images?path=…` | Remove an image (from Storage and the product). |
| `GET /api/admin/orders` | Query `status`, `q` (order no./name/email), `page`, `pageSize`. |
| `GET /api/admin/orders/{id}` | Order with items and status history. |
| `PATCH /api/admin/orders/{id}` | `{ status?, paymentStatus?, note? }`. Transitions are validated in the database: forward only (`pending→confirmed→shipped→delivered`), cancel allowed before delivery, cancelled is final, cancel restocks exactly once. |
| `GET /api/admin/stats` | Totals, paid/pending revenue, 7-day series, low-stock list, recent orders. |
| `GET/PATCH /api/admin/settings` | `{ freeShippingThreshold, flatShipping }`. |

**Revenue definition:** sum of `total` for orders with `payment_status = 'paid'` and `status <> 'cancelled'`. "Awaiting payment" = `unpaid` and not cancelled. For Cash on Delivery, the owner marks an order *Paid* after collecting cash.

## Known limitations
- **No rate limiting / CAPTCHA** on `/api/orders`, `/api/quote` or sign-up. Add at your host/CDN (e.g. Vercel Firewall) or enable Supabase CAPTCHA before public launch.
- The cart lives in the browser (`localStorage`), so it persists across refreshes but not across devices. Everything in it is re-validated server-side at checkout.
- The storefront downloads the (≤500-product) catalog once and filters in the browser. `GET /api/products` supports server-side filtering and pagination for when the catalog grows.
- `product_reviews` and `addresses` tables, RLS and policies exist, but there is no review or saved-address UI yet. The product page still shows clearly labelled sample reviews.
- No transactional emails (order confirmation) and no online payments.
- Guest order tokens are kept in the browser that placed the order; clearing site data loses access to the confirmation page (the order is still in the database).
- Order numbers use a global sequence, so gaps appear if an order transaction rolls back.

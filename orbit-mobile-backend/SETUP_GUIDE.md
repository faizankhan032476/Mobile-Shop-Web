# Orbit Mobile: Backend Setup Guide (beginner friendly)

This guide connects the shop to a real database. Follow the steps in order. Commands are for **Windows PowerShell**.

**Legend**
- 🖱️ **YOU (dashboard)**: something you click in the Supabase website.
- ⌨️ **YOU (PowerShell)**: a command you type.
- 🤖 **Already done by Claude** in the code you received: no action needed.

> **Project folder** = the folder that contains `package.json` (the folder named `orbit-mobile`). Every PowerShell command below must be run from there unless said otherwise.

---

## 0. What you are building

```
Browser  ->  Next.js website + /api routes  ->  Supabase (Postgres database + Auth + Storage)
```
- **Supabase** stores products, orders and user accounts, and handles sign-in.
- Your website never contains your database password or any secret key. It only uses a *publishable* key, and the database itself decides what each visitor may see (Row Level Security).

## 1. What was already done for you 🤖

- All backend code: `/api/*` routes, sign-in/register/reset pages, admin dashboard connected to real data.
- Database files in `supabase/`: `migrations/0001…0004`, `seed.sql`, `first-admin.sql`.
- Tests (`npm test`) and docs (`API_DOCUMENTATION.md`, `docs/DATABASE.md`).

**What has NOT been tested:** the code has **not** been run against a live Supabase project (no credentials were available). The SQL was tested in an in-memory Postgres, and the API layer with mocked sessions. Section 11 gives you a checklist to verify the real thing.

## 2. Install the tools ⌨️

You need **Node.js 20.9 or newer** (version 22 LTS is a good choice). Check:

```powershell
node -v
npm -v
```
If `node` is not found, install the LTS version from https://nodejs.org and reopen PowerShell.

From the project folder:
```powershell
cd "C:\path\to\orbit-mobile"
npm install
```

## 3. Create your Supabase project 🖱️

1. Go to https://supabase.com and create an account (free tier is fine).
2. Click **New project**. Choose an organization, a name (e.g. `orbit-mobile`), and a **region close to Pakistan's users** (e.g. Singapore or Mumbai if offered).
3. **Database password.** Supabase asks you to set one (or generates one). This is the master password of your database.
   - Save it in a password manager (Bitwarden, 1Password, etc.).
   - **Never** paste it into this website's code, into `.env.local`, into chat messages or into Git. This app does not need it at all.
   - If you lose it you can reset it later in *Project Settings > Database*.
4. Click **Create new project** and wait ~2 minutes until it finishes setting up.

## 4. Find your project URL and publishable key 🖱️

In your project:
1. Open **Settings > API Keys** (or click the **Connect** button at the top of the project).
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`). It is also shown on the Connect screen.
3. Open the tab **Publishable and secret API keys**. If there is no publishable key yet, click **Create new API Keys**. Copy the **Publishable key** (starts with `sb_publishable_`).

> ⚠️ Do **not** copy the *secret* key (`sb_secret_…`) or the legacy `service_role` key anywhere in this project. They bypass all security. This app doesn't use them.

(Supabase is retiring the older `anon` key by the end of 2026. If your dashboard only shows `anon`, that key also works in the same variable: it is the legacy name for the publishable key.)

## 5. Create `.env.local` ⌨️

In the project folder:
```powershell
Copy-Item .env.example .env.local
notepad .env.local
```
Replace the placeholders:
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Save and close. `.env.local` is already ignored by Git, so it won't be committed.

## 6. Create the database tables 🖱️ (SQL Editor)

In Supabase open **SQL Editor > New query**. For **each file below, in this exact order**: open it from your project folder in Notepad, copy everything, paste into the SQL Editor, click **Run**, and wait for "Success".

| Order | File (in `supabase\`) | What it does |
|---|---|---|
| 1 | `migrations\0001_schema.sql` | Creates tables, constraints, indexes |
| 2 | `migrations\0002_rls.sql` | Locks everything down with permissions + Row Level Security |
| 3 | `migrations\0003_functions.sql` | Order creation, stock handling, admin actions |
| 4 | `migrations\0004_storage.sql` | Creates the `product-images` bucket and its rules |
| 5 | `seed.sql` | Adds **demo** phones (flagged `is_demo`) and two demo discount codes |

Rules: run each file **once**, in order. If a file errors halfway, don't re-run it blindly; see *Troubleshooting*.

**Check:** *Table Editor* should list `products`, `orders`, `profiles`…, and `products` should show 12 rows.

## 7. Check the image bucket 🖱️

`0004_storage.sql` already created it. To confirm: **Storage** in the left menu → you should see **product-images** marked *Public*.
If it is missing, create it manually: **Storage > New bucket** → name `product-images`, toggle **Public bucket** on, set file size limit `5 MB`, allowed types `image/jpeg, image/png, image/webp, image/avif`. Then re-run only the four `create policy` lines from `0004_storage.sql`.
Public means *anyone can view* product photos (that's what a shop needs). Only admins can upload or delete (enforced by the policies).

## 8. Configure sign-in 🖱️

**Authentication > URL Configuration** (wording may differ slightly):
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/auth/callback`

**Authentication > Sign In / Providers > Email:** keep *Confirm email* **on** for a real shop. For quick local testing you may turn it off; you will then be signed in immediately after registering.
Note: Supabase's built-in email sender is heavily rate limited. Before launch, set up your own SMTP provider (*Authentication > Emails > SMTP Settings*).

## 9. Run the website ⌨️

```powershell
npm run dev
```
Open http://localhost:3000. You should see the shop with the 12 demo phones. (If you see "The backend isn't configured yet", re-check `.env.local`, then stop the server with `Ctrl+C` and start it again. Env files are read only at startup.)

## 10. Create the first admin account (safely)

Admin rights are stored in the database (`profiles.role`). **Nobody can grant them through the website or the API**, not even an existing admin. Only SQL run by you in the dashboard can.

1. 🖱️ Open http://localhost:3000/register and create *your* account (use your real email). Confirm the email if asked.
2. 🖱️ In Supabase **SQL Editor**, open `supabase\first-admin.sql`, replace `owner@example.com` with your email, and **Run**. The final query should show one row with `role = admin`.
3. Sign out and back in on the website, then open http://localhost:3000/admin.

Anyone else who visits `/admin` sees "Administrators only", and the `/api/admin/*` routes and the database itself refuse them too.

## 11. Verify everything works (checklist)

| Test | Expected |
|---|---|
| Home / Shop | 12 demo phones load; search "samsung" finds Samsung phones |
| Register + log in | Account page shows your email; **Sign out** works |
| Forgot password | Email arrives; the link opens "Choose a new password" |
| Add to cart → Checkout (as guest) | Order confirmation with an `ORB-…` number; stock drops by the quantity |
| Double-click "Place order" | Still only **one** order |
| Discount code | `ORBIT5` gives 5% off (demo code) |
| `/orders` when signed in | Shows only your orders |
| `/admin` → Products | Add a product, upload a photo, change stock; the shop shows it right away |
| `/admin` → Orders | Change status to Confirmed → Shipped; Cancel returns stock |
| Another (non-admin) account at `/admin` | "Administrators only" |
| **Persistence** | In Supabase *Table Editor* open `orders` and `products`: your changes are there. Stop `npm run dev`, start it again, reload: data is still there. |

Automated checks you can also run:
```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## 12. Deploy (Vercel example)

1. Push the project to a private GitHub repository (`.env.local` is ignored, so secrets stay out).
2. 🖱️ On https://vercel.com choose **Add New > Project**, import the repo.
3. 🖱️ Before deploying, open **Environment Variables** and add the same three variables as `.env.local`, with `NEXT_PUBLIC_SITE_URL` set to your real address (e.g. `https://yourshop.com`).
4. Deploy.
5. 🖱️ In Supabase **Authentication > URL Configuration** set **Site URL** to your live address and add `https://yourshop.com/auth/callback` to **Redirect URLs**.
6. Repeat the checklist from section 11 on the live site.

## 13. Changing the database later (safely)

- **Never edit old migration files or re-run them.** Create a new file, e.g. `supabase\migrations\0005_add_warranty_column.sql`, containing only the change (e.g. `alter table public.products add column warranty_months int;`).
- Prefer *additive* changes (add columns/tables). For anything destructive (drop/rename), first take a backup: **Database > Backups**.
- Try the change on a second free Supabase project first.
- Never run `seed.sql` changes that delete data; the seed only inserts with `ON CONFLICT DO NOTHING`.
- Remember to keep Row Level Security **enabled** on every new table and grant only what's needed (see `docs/DATABASE.md`).

## 14. Troubleshooting

| Problem | Fix |
|---|---|
| "The backend isn't configured yet" | `.env.local` missing/misspelled variables. Restart `npm run dev`. |
| Shop is empty / "permission denied" / "relation does not exist" | A migration was skipped. Re-check section 6 in order. Also check **Integrations > Data API**: the `public` schema must be exposed. |
| Register works but no email arrives | Check spam; built-in email is rate limited; configure SMTP, or turn off *Confirm email* for local testing. |
| Link in email says "expired" | Links are single-use and expire. Request a new one. Make sure the Redirect URL in section 8 matches exactly. |
| `/admin` says "Administrators only" for you | You didn't run `first-admin.sql` with the right email, or you must sign out/in again. |
| Checkout says "not enough stock" | Working as designed: stock is checked in the database. Increase stock in Admin > Products. |
| Image upload fails | Bucket missing or policies not created (section 7); file over 5 MB or not JPEG/PNG/WebP/AVIF; you are not admin. |
| `npm install` peer-dependency error | Use Node 20.9+; delete `node_modules` and `package-lock.json`, run `npm install` again. |
| Port 3000 in use | `npm run dev -- -p 3001` (and update the Site URL / Redirect URLs). |

## 15. Security reminders

- Never commit `.env.local`; never share your database password or any `sb_secret_` key.
- Add rate limiting / CAPTCHA before public launch (see *Known limitations* in `API_DOCUMENTATION.md`).
- Online payments are **not** implemented: Cash on Delivery only.

-- 0001_schema.sql : tables, constraints, indexes, triggers.
-- Run FIRST. Safe to read top-to-bottom; creates objects only (never drops data).

create type public.user_role      as enum ('customer', 'admin');
create type public.order_status   as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded', 'failed');

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- catalog ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 2 and 60),
  blurb text not null default '',
  sort_order int not null default 0
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 2 and 60)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text not null unique check (length(sku) between 2 and 40),
  name text not null check (length(name) between 3 and 120),
  brand_id uuid not null references public.brands(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  description text not null default '' check (length(description) <= 4000),
  price integer not null check (price > 0),                       -- PKR, whole rupees
  compare_at_price integer check (compare_at_price is null or compare_at_price >= price),
  colors jsonb not null default '[]' check (jsonb_typeof(colors) = 'array' and jsonb_array_length(colors) between 1 and 12),
  storage_options text[] not null check (cardinality(storage_options) between 1 and 8),
  specs jsonb not null default '{}' check (jsonb_typeof(specs) = 'object'),
  images text[] not null default '{}' check (cardinality(images) <= 10),   -- storage paths or https URLs
  stock integer not null default 0 check (stock >= 0),
  is_published boolean not null default true,
  is_featured boolean not null default false,
  is_on_sale boolean not null default false,
  is_demo boolean not null default false,                         -- true for seeded sample rows
  popularity integer not null default 0 check (popularity >= 0),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_brand_idx on public.products (brand_id);
create index products_category_idx on public.products (category_id);
create index products_listing_idx on public.products (is_published, created_at desc);
create index products_name_idx on public.products (lower(name));
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();

-- ---------- people ----------
-- Credentials live in Supabase Auth (auth.users). This table only holds profile data + role.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 100),
  phone text check (phone is null or phone ~ '^03[0-9]{9}$'),
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home' check (length(label) <= 40),
  full_name text not null check (length(full_name) between 3 and 100),
  phone text not null check (phone ~ '^03[0-9]{9}$'),
  address_line text not null check (length(address_line) between 8 and 300),
  city text not null check (length(city) between 2 and 80),
  postal_code text check (postal_code is null or postal_code ~ '^[0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

-- Auto-create a profile for every new auth user. Role is ALWAYS 'customer' here.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- commerce ----------
create table public.discount_codes (
  code text primary key check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  percent_off integer not null check (percent_off between 1 and 90),
  min_subtotal integer not null default 0 check (min_subtotal >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  is_demo boolean not null default false
);

create table public.store_settings (
  key text primary key check (key ~ '^[a-z_]{2,50}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,   -- null for guest checkout
  guest_token uuid,                                                   -- secret handed only to the guest who placed it
  idempotency_key text not null unique check (length(idempotency_key) between 16 and 64),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,                                    -- snapshot, never joined to addresses
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  payment_method text not null check (payment_method in ('cod')),     -- add providers here in a later phase
  subtotal integer not null check (subtotal >= 0),
  shipping_cost integer not null check (shipping_cost >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  discount_code text,
  total integer not null check (total >= 0),
  stock_restored boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches check (total = subtotal - discount_amount + shipping_cost),
  constraint orders_guest_or_user check ((user_id is null) = (guest_token is not null))
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,  -- survives product deletion
  product_name text not null,
  sku text not null,
  color text not null,
  storage text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total integer not null check (line_total = unit_price * quantity)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text check (note is null or length(note) <= 300),
  created_at timestamptz not null default now()
);
create index order_history_order_idx on public.order_status_history (order_id, created_at);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null check (length(body) between 5 and 1000),
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- keep products.rating / review_count in sync with real reviews
create or replace function public.refresh_product_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    review_count = (select count(*) from public.product_reviews where product_id = pid),
    rating = coalesce((select round(avg(rating)::numeric, 1) from public.product_reviews where product_id = pid), 0)
  where p.id = pid;
  return null;
end $$;
create trigger reviews_rating after insert or update or delete on public.product_reviews
  for each row execute function public.refresh_product_rating();

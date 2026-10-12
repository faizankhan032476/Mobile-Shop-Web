-- 0003_functions.sql : server-side business logic (pricing, orders, inventory, admin).
-- Run THIRD. All amounts are whole PKR. Clients never supply prices or totals.

-- ---- internal: price a cart from authoritative rows --------------------------------
create or replace function public._price_cart(p_items jsonb, p_code text, p_lock boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[]; v_lines jsonb := '[]'::jsonb; v_item jsonb; v_prod public.products%rowtype;
  v_qty int; v_color text; v_storage text; v_key text; v_seen text[] := '{}';
  v_subtotal int := 0; v_discount int := 0; v_shipping int; v_threshold int; v_flat int;
  v_code public.discount_codes%rowtype;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'INVALID_CART';
  end if;
  begin
    select array_agg((e ->> 'product_id')::uuid) into v_ids from jsonb_array_elements(p_items) e;
  exception when others then raise exception 'INVALID_CART';
  end;
  if p_lock then  -- lock in a fixed order so concurrent orders cannot deadlock
    perform 1 from public.products where id = any (v_ids) order by id for update;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_qty := (v_item ->> 'quantity')::int; v_color := v_item ->> 'color'; v_storage := v_item ->> 'storage';
    exception when others then raise exception 'INVALID_CART';
    end;
    if v_qty is null or v_qty not between 1 and 10 or v_color is null or v_storage is null then raise exception 'INVALID_CART'; end if;

    select * into v_prod from public.products where id = (v_item ->> 'product_id')::uuid and is_published;
    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;

    v_key := v_prod.id::text || '|' || v_color || '|' || v_storage;
    if v_key = any (v_seen) then raise exception 'INVALID_CART'; end if;
    v_seen := v_seen || v_key;

    if not (v_prod.colors @> jsonb_build_array(jsonb_build_object('name', v_color)))
       or not (v_storage = any (v_prod.storage_options)) then
      raise exception 'INVALID_VARIANT' using detail = v_prod.name;
    end if;
    if v_prod.stock < v_qty then raise exception 'INSUFFICIENT_STOCK' using detail = v_prod.name; end if;

    v_subtotal := v_subtotal + v_prod.price * v_qty;
    v_lines := v_lines || jsonb_build_object('product_id', v_prod.id, 'name', v_prod.name, 'sku', v_prod.sku,
      'color', v_color, 'storage', v_storage, 'quantity', v_qty, 'unit_price', v_prod.price, 'line_total', v_prod.price * v_qty);
  end loop;

  if p_code is not null and btrim(p_code) <> '' then
    if p_lock then
      select * into v_code from public.discount_codes where code = upper(btrim(p_code)) for update;
    else
      select * into v_code from public.discount_codes where code = upper(btrim(p_code));
    end if;
    if not found or not v_code.active or (v_code.expires_at is not null and v_code.expires_at <= now())
       or (v_code.max_uses is not null and v_code.used_count >= v_code.max_uses) or v_subtotal < v_code.min_subtotal then
      raise exception 'INVALID_DISCOUNT';
    end if;
    v_discount := round(v_subtotal * v_code.percent_off / 100.0);
  end if;

  select (value #>> '{}')::int into v_threshold from public.store_settings where key = 'free_shipping_threshold';
  select (value #>> '{}')::int into v_flat      from public.store_settings where key = 'flat_shipping';
  v_shipping := case when v_subtotal >= coalesce(v_threshold, 150000) then 0 else coalesce(v_flat, 500) end;

  return jsonb_build_object('lines', v_lines, 'subtotal', v_subtotal, 'discount', v_discount, 'shipping', v_shipping,
    'total', v_subtotal - v_discount + v_shipping, 'discount_code', v_code.code);
end $$;
revoke execute on function public._price_cart(jsonb, text, boolean) from public, anon, authenticated;

-- internal: order as JSON (used by guest lookup)
create or replace function public._order_json(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(o) - 'guest_token' - 'idempotency_key' || jsonb_build_object('items',
    coalesce((select jsonb_agg(to_jsonb(i) - 'order_id' order by i.product_name) from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o where o.id = p_id
$$;
revoke execute on function public._order_json(uuid) from public, anon, authenticated;

-- ---- public: price preview (no side effects) -----------------------------------------
create or replace function public.quote_order(p_items jsonb, p_discount_code text default null)
returns jsonb language sql security definer set search_path = public as $$
  select public._price_cart(p_items, p_discount_code, false)
$$;

-- ---- public: create an order atomically ----------------------------------------------
create or replace function public.create_order(
  p_idempotency_key text, p_items jsonb, p_customer jsonb, p_shipping jsonb,
  p_payment_method text, p_discount_code text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_existing public.orders%rowtype; v_quote jsonb; v_line jsonb;
  v_id uuid; v_number text; v_token uuid;
  v_name text := btrim(coalesce(p_customer ->> 'name', '')); v_email text := lower(btrim(coalesce(p_customer ->> 'email', '')));
  v_phone text := regexp_replace(coalesce(p_customer ->> 'phone', ''), '[\s-]', '', 'g');
  v_addr text := btrim(coalesce(p_shipping ->> 'address', '')); v_city text := btrim(coalesce(p_shipping ->> 'city', ''));
  v_postal text := nullif(btrim(coalesce(p_shipping ->> 'postal_code', '')), '');
begin
  if p_idempotency_key is null or length(p_idempotency_key) not between 16 and 64 then raise exception 'INVALID_IDEMPOTENCY_KEY'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));   -- serialises double-submits
  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('id', v_existing.id, 'order_number', v_existing.order_number,
      'guest_token', v_existing.guest_token, 'total', v_existing.total, 'duplicate', true);
  end if;

  if p_payment_method is distinct from 'cod' then raise exception 'PAYMENT_METHOD_UNSUPPORTED'; end if;
  v_phone := regexp_replace(v_phone, '^(\+92|0092|92)', '0');
  if length(v_name) not between 3 and 100 then raise exception 'INVALID_CUSTOMER' using detail = 'name'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' or length(v_email) > 254 then raise exception 'INVALID_CUSTOMER' using detail = 'email'; end if;
  if v_phone !~ '^03[0-9]{9}$' then raise exception 'INVALID_CUSTOMER' using detail = 'phone'; end if;
  if length(v_addr) not between 8 and 300 then raise exception 'INVALID_SHIPPING' using detail = 'address'; end if;
  if length(v_city) not between 2 and 80 then raise exception 'INVALID_SHIPPING' using detail = 'city'; end if;
  if v_postal is not null and v_postal !~ '^[0-9]{5}$' then raise exception 'INVALID_SHIPPING' using detail = 'postal_code'; end if;

  v_quote := public._price_cart(p_items, p_discount_code, true);       -- locks product rows
  v_token := case when v_uid is null then gen_random_uuid() end;
  v_number := 'ORB-' || to_char(now() at time zone 'Asia/Karachi', 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (order_number, user_id, guest_token, idempotency_key, customer_name, customer_email, customer_phone,
      shipping_address, payment_method, subtotal, shipping_cost, discount_amount, discount_code, total)
  values (v_number, v_uid, v_token, p_idempotency_key, v_name, v_email, v_phone,
      jsonb_build_object('address', v_addr, 'city', v_city, 'postal_code', v_postal), 'cod',
      (v_quote ->> 'subtotal')::int, (v_quote ->> 'shipping')::int, (v_quote ->> 'discount')::int, v_quote ->> 'discount_code', (v_quote ->> 'total')::int)
  returning id into v_id;

  for v_line in select * from jsonb_array_elements(v_quote -> 'lines') loop
    insert into public.order_items (order_id, product_id, product_name, sku, color, storage, unit_price, quantity, line_total)
    values (v_id, (v_line ->> 'product_id')::uuid, v_line ->> 'name', v_line ->> 'sku', v_line ->> 'color', v_line ->> 'storage',
            (v_line ->> 'unit_price')::int, (v_line ->> 'quantity')::int, (v_line ->> 'line_total')::int);
    update public.products set stock = stock - (v_line ->> 'quantity')::int, popularity = popularity + (v_line ->> 'quantity')::int
    where id = (v_line ->> 'product_id')::uuid;                         -- check (stock >= 0) is the last line of defence
  end loop;

  if v_quote ->> 'discount_code' is not null then
    update public.discount_codes set used_count = used_count + 1 where code = v_quote ->> 'discount_code';
  end if;
  insert into public.order_status_history (order_id, to_status, note) values (v_id, 'pending', 'Order placed');

  return jsonb_build_object('id', v_id, 'order_number', v_number, 'guest_token', v_token, 'total', (v_quote ->> 'total')::int, 'duplicate', false);
end $$;

-- ---- public: guests read their own order with the secret token -------------------------
create or replace function public.get_guest_order(p_order_id uuid, p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select public._order_json(o.id) from public.orders o
  where o.id = p_order_id and o.guest_token is not null and o.guest_token = p_token
$$;

-- ---- admin ------------------------------------------------------------------------------
create or replace function public.admin_set_order_status(p_order_id uuid, p_status public.order_status default null,
    p_payment_status public.payment_status default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_o public.orders%rowtype; v_order text[] := array['pending','confirmed','shipped','delivered','cancelled'];
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into v_o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  if p_status is not null and p_status <> v_o.status then
    if v_o.status = 'cancelled' then raise exception 'INVALID_TRANSITION'; end if;
    if p_status <> 'cancelled' and array_position(v_order, p_status::text) < array_position(v_order, v_o.status::text) then
      raise exception 'INVALID_TRANSITION';
    end if;
    if p_status = 'cancelled' then
      if v_o.status = 'delivered' then raise exception 'INVALID_TRANSITION'; end if;
      if not v_o.stock_restored then
        update public.products p set stock = p.stock + i.quantity, popularity = greatest(0, p.popularity - i.quantity)
        from public.order_items i where i.order_id = v_o.id and i.product_id = p.id;
      end if;
      update public.orders set stock_restored = true where id = v_o.id;
      if v_o.payment_status = 'paid' then p_payment_status := coalesce(p_payment_status, 'refunded'); end if;
    end if;
    update public.orders set status = p_status where id = v_o.id;
    insert into public.order_status_history (order_id, from_status, to_status, changed_by, note)
    values (v_o.id, v_o.status, p_status, auth.uid(), left(p_note, 300));
  end if;
  if p_payment_status is not null then update public.orders set payment_status = p_payment_status where id = v_o.id; end if;
  return public._order_json(v_o.id);
end $$;

create or replace function public.admin_adjust_stock(p_product_id uuid, p_delta int) returns int
language plpgsql security definer set search_path = public as $$
declare v_new int;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_delta is null or p_delta = 0 or abs(p_delta) > 100000 then raise exception 'INVALID_DELTA'; end if;
  update public.products set stock = stock + p_delta where id = p_product_id returning stock into v_new;  -- check (stock >= 0)
  if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
  return v_new;
end $$;

-- Revenue definition: orders that are PAID and not cancelled/refunded. "Pending revenue": unpaid and not cancelled.
create or replace function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'products', (select count(*) from public.products),
    'orders', (select count(*) from public.orders),
    'revenue_paid', coalesce((select sum(total) from public.orders where payment_status = 'paid' and status <> 'cancelled'), 0),
    'revenue_pending', coalesce((select sum(total) from public.orders where payment_status = 'unpaid' and status <> 'cancelled'), 0),
    'low_stock', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'slug', slug, 'name', name, 'stock', stock) order by stock, name)
                           from public.products where stock <= 5), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(d order by d.day) from (
        select (created_at at time zone 'Asia/Karachi')::date as day, count(*) as orders, sum(total) as total
        from public.orders where status <> 'cancelled' and created_at > now() - interval '7 days' group by 1) d), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(to_jsonb(r)) from (
        select id, order_number, customer_name, status, payment_status, total, created_at
        from public.orders order by created_at desc limit 5) r), '[]'::jsonb));
end $$;

-- ---- execute permissions: deny by default, then allow --------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.quote_order(jsonb, text) to anon, authenticated;
grant execute on function public.create_order(text, jsonb, jsonb, jsonb, text, text) to anon, authenticated;
grant execute on function public.get_guest_order(uuid, uuid) to anon, authenticated;
grant execute on function public.admin_set_order_status(uuid, public.order_status, public.payment_status, text) to authenticated;
grant execute on function public.admin_adjust_stock(uuid, int) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- 0002_rls.sql : roles, least-privilege grants, Row Level Security.
-- Run SECOND.

-- Admin check. SECURITY DEFINER so it can read profiles without recursing into RLS.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Nobody can change a role through the API. Only trusted SQL (SQL Editor / postgres role, where auth.uid() is null).
create or replace function public.block_role_change() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'ROLE_CHANGE_FORBIDDEN';
  end if;
  return new;
end $$;
create trigger profiles_block_role before update on public.profiles for each row execute function public.block_role_change();

-- Start from zero privileges, then grant only what the API needs.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

grant select on public.categories, public.brands, public.products, public.store_settings, public.product_reviews to anon, authenticated;
grant select on public.profiles, public.orders, public.order_items, public.order_status_history to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;           -- NOT role
grant select, insert, update, delete on public.addresses to authenticated;
grant insert, update, delete on public.categories, public.brands, public.products, public.store_settings to authenticated; -- admin-only via RLS
grant select, insert, update, delete on public.discount_codes to authenticated;                                           -- admin-only via RLS
grant insert, update, delete on public.product_reviews to authenticated;

alter table public.categories           enable row level security;
alter table public.brands               enable row level security;
alter table public.products             enable row level security;
alter table public.profiles             enable row level security;
alter table public.addresses            enable row level security;
alter table public.discount_codes       enable row level security;
alter table public.store_settings       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.product_reviews      enable row level security;

-- catalog: public read, admin write
create policy categories_read  on public.categories for select using (true);
create policy categories_admin on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy brands_read      on public.brands for select using (true);
create policy brands_admin     on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy products_read    on public.products for select using (is_published or public.is_admin());
create policy products_insert  on public.products for insert to authenticated with check (public.is_admin());
create policy products_update  on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_delete  on public.products for delete to authenticated using (public.is_admin());

create policy settings_read    on public.store_settings for select using (true);
create policy settings_admin   on public.store_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy discounts_admin  on public.discount_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- people: own rows only
create policy profiles_read_own    on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_own  on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy addresses_own        on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders: read-only for clients (own, or admin). All writes go through SECURITY DEFINER functions in 0003.
create policy orders_read on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy order_history_read on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- reviews: anyone reads; only customers with a DELIVERED order for that product may write their own
create policy reviews_read   on public.product_reviews for select using (true);
create policy reviews_insert on public.product_reviews for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.user_id = auth.uid() and o.status = 'delivered' and oi.product_id = product_reviews.product_id));
create policy reviews_update on public.product_reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_delete on public.product_reviews for delete to authenticated using (user_id = auth.uid() or public.is_admin());

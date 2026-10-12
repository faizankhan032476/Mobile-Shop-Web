-- seed.sql : DEMO DATA ONLY. Every product/discount row below is flagged is_demo = true.
-- Safe to re-run: uses ON CONFLICT DO NOTHING. Run AFTER the four migrations.

insert into public.categories (slug, name, blurb, sort_order) values
  ('flagship', 'Flagship', 'Top cameras and chips', 0),
  ('mid-range', 'Mid-range', 'The sensible sweet spot', 1),
  ('budget', 'Budget', 'Big battery, small price', 2),
  ('foldable', 'Foldable', 'Two screens in one', 3)
on conflict (slug) do nothing;

insert into public.brands (slug, name) values
  ('apple', 'Apple'),
  ('samsung', 'Samsung'),
  ('google', 'Google'),
  ('xiaomi', 'Xiaomi'),
  ('oneplus', 'OnePlus'),
  ('infinix', 'Infinix'),
  ('tecno', 'Tecno')
on conflict (slug) do nothing;

insert into public.store_settings (key, value) values
  ('free_shipping_threshold', '150000'::jsonb), ('flat_shipping', '500'::jsonb), ('store_name', '"Orbit Mobile (demo)"'::jsonb)
on conflict (key) do nothing;

insert into public.discount_codes (code, percent_off, is_demo) values ('ORBIT5', 5, true), ('WELCOME2', 2, true) on conflict (code) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'iphone-16-pro-max', 'ORB-IPHONE-16-PRO-MAX', 'Apple iPhone 16 Pro Max', b.id, c.id, '[Demo product] A large 6.9-inch display, a 48MP camera system with 5x telephoto and the A18 Pro chip in a titanium body.', 589000, 619000,
  $j$[{"name":"Desert Titanium","hex":"#b9a58f"},{"name":"Natural Titanium","hex":"#a7a6a0"},{"name":"Black Titanium","hex":"#2d2e30"}]$j$::jsonb, array['256GB', '512GB', '1TB'], $j${"Display":"6.9\" LTPO OLED, 120Hz","Processor":"Apple A18 Pro","Camera":"48MP + 48MP + 12MP","Battery":"4685 mAh, 25W wireless","Operating system":"iOS 18"}$j$::jsonb, '{}', 14, true, true, true, true, 980, 4.8, 212, '2026-08-12'
from public.brands b, public.categories c where b.slug = 'apple' and c.slug = 'flagship'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'galaxy-s25-ultra', 'ORB-GALAXY-S25-ULTRA', 'Samsung Galaxy S25 Ultra', b.id, c.id, '[Demo product] A 6.9-inch Dynamic AMOLED screen, built-in S Pen, 200MP main camera and Snapdragon 8 Elite.', 459000, 489000,
  $j$[{"name":"Titanium Silverblue","hex":"#8fa3b8"},{"name":"Titanium Black","hex":"#26282b"},{"name":"Titanium Gray","hex":"#8b8d90"}]$j$::jsonb, array['256GB', '512GB', '1TB'], $j${"Display":"6.9\" Dynamic AMOLED 2X, 120Hz","Processor":"Snapdragon 8 Elite","Camera":"200MP + 50MP + 10MP + 50MP","Battery":"5000 mAh, 45W","Operating system":"Android 15, One UI 7"}$j$::jsonb, '{}', 22, true, true, true, true, 910, 4.7, 187, '2026-07-02'
from public.brands b, public.categories c where b.slug = 'samsung' and c.slug = 'flagship'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'pixel-9-pro', 'ORB-PIXEL-9-PRO', 'Google Pixel 9 Pro', b.id, c.id, '[Demo product] Clean Android, a superb camera and seven years of updates, powered by Google Tensor G4.', 339000, null,
  $j$[{"name":"Porcelain","hex":"#e4dfd6"},{"name":"Obsidian","hex":"#2a2c2f"},{"name":"Hazel","hex":"#8c8f7e"}]$j$::jsonb, array['128GB', '256GB', '512GB'], $j${"Display":"6.3\" LTPO OLED, 120Hz","Processor":"Google Tensor G4","Camera":"50MP + 48MP + 48MP","Battery":"4700 mAh, 37W","Operating system":"Android 15"}$j$::jsonb, '{}', 9, true, true, false, true, 540, 4.6, 96, '2026-06-18'
from public.brands b, public.categories c where b.slug = 'google' and c.slug = 'flagship'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'xiaomi-14-ultra', 'ORB-XIAOMI-14-ULTRA', 'Xiaomi 14 Ultra', b.id, c.id, '[Demo product] A Leica-tuned quad camera with a one-inch main sensor and fast HyperCharge.', 389000, 419000,
  $j$[{"name":"Black","hex":"#1f2022"},{"name":"White","hex":"#ecebe6"}]$j$::jsonb, array['512GB', '1TB'], $j${"Display":"6.73\" LTPO AMOLED, 120Hz","Processor":"Snapdragon 8 Gen 3","Camera":"50MP x4 Leica","Battery":"5000 mAh, 90W","Operating system":"Android 14, HyperOS"}$j$::jsonb, '{}', 6, true, false, true, true, 410, 4.5, 64, '2026-05-09'
from public.brands b, public.categories c where b.slug = 'xiaomi' and c.slug = 'flagship'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'galaxy-z-fold6', 'ORB-GALAXY-Z-FOLD6', 'Samsung Galaxy Z Fold6', b.id, c.id, '[Demo product] A 7.6-inch inner display that turns your phone into a tablet.', 649000, null,
  $j$[{"name":"Navy","hex":"#2b3550"},{"name":"Silver Shadow","hex":"#b9bcc2"}]$j$::jsonb, array['256GB', '512GB'], $j${"Display":"7.6\" inner + 6.3\" cover AMOLED","Processor":"Snapdragon 8 Gen 3","Camera":"50MP + 12MP + 10MP","Battery":"4400 mAh, 25W","Operating system":"Android 14, One UI 6.1"}$j$::jsonb, '{}', 4, true, false, false, true, 220, 4.4, 41, '2026-04-20'
from public.brands b, public.categories c where b.slug = 'samsung' and c.slug = 'foldable'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'oneplus-13', 'ORB-ONEPLUS-13', 'OnePlus 13', b.id, c.id, '[Demo product] A huge 6000 mAh battery with 100W charging and a Hasselblad-tuned triple camera.', 279000, null,
  $j$[{"name":"Midnight Ocean","hex":"#1c2f3a"},{"name":"Arctic Dawn","hex":"#d7dde3"}]$j$::jsonb, array['256GB', '512GB'], $j${"Display":"6.82\" LTPO AMOLED, 120Hz","Processor":"Snapdragon 8 Elite","Camera":"50MP x3 Hasselblad","Battery":"6000 mAh, 100W","Operating system":"Android 15, OxygenOS"}$j$::jsonb, '{}', 17, true, true, false, true, 480, 4.6, 73, '2026-08-28'
from public.brands b, public.categories c where b.slug = 'oneplus' and c.slug = 'flagship'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'galaxy-a56', 'ORB-GALAXY-A56', 'Samsung Galaxy A56 5G', b.id, c.id, '[Demo product] A bright AMOLED display and six years of updates at a mid-range price.', 119000, 129000,
  $j$[{"name":"Awesome Graphite","hex":"#3a3b3f"},{"name":"Awesome Olive","hex":"#8a8f73"}]$j$::jsonb, array['128GB', '256GB'], $j${"Display":"6.7\" Super AMOLED, 120Hz","Processor":"Exynos 1580","Camera":"50MP + 12MP + 5MP","Battery":"5000 mAh, 45W","Operating system":"Android 15, One UI 7"}$j$::jsonb, '{}', 40, true, true, true, true, 760, 4.3, 130, '2026-09-04'
from public.brands b, public.categories c where b.slug = 'samsung' and c.slug = 'mid-range'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'redmi-note-14-pro', 'ORB-REDMI-NOTE-14-PRO', 'Xiaomi Redmi Note 14 Pro+', b.id, c.id, '[Demo product] 200MP camera, curved AMOLED and 120W charging.', 109000, null,
  $j$[{"name":"Midnight Black","hex":"#222427"},{"name":"Aurora Purple","hex":"#8a7ba8"}]$j$::jsonb, array['256GB', '512GB'], $j${"Display":"6.67\" AMOLED, 120Hz","Processor":"Snapdragon 7s Gen 3","Camera":"200MP + 8MP + 2MP","Battery":"5110 mAh, 120W","Operating system":"Android 14, HyperOS"}$j$::jsonb, '{}', 33, true, false, false, true, 840, 4.4, 158, '2026-07-22'
from public.brands b, public.categories c where b.slug = 'xiaomi' and c.slug = 'mid-range'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'pixel-8a', 'ORB-PIXEL-8A', 'Google Pixel 8a', b.id, c.id, '[Demo product] Google''s camera brains and seven years of updates in a compact body.', 149000, 169000,
  $j$[{"name":"Bay","hex":"#7fa6c4"},{"name":"Obsidian","hex":"#2a2c2f"}]$j$::jsonb, array['128GB', '256GB'], $j${"Display":"6.1\" OLED, 120Hz","Processor":"Google Tensor G3","Camera":"64MP + 13MP","Battery":"4492 mAh, 18W","Operating system":"Android 14"}$j$::jsonb, '{}', 0, true, false, true, true, 390, 4.4, 88, '2026-03-14'
from public.brands b, public.categories c where b.slug = 'google' and c.slug = 'mid-range'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'infinix-hot-50', 'ORB-INFINIX-HOT-50', 'Infinix Hot 50 Pro+', b.id, c.id, '[Demo product] A slim AMOLED phone with a 108MP camera at an easy price.', 54000, null,
  $j$[{"name":"Sleek Black","hex":"#25262a"},{"name":"Glacier Blue","hex":"#9bb7cc"}]$j$::jsonb, array['128GB', '256GB'], $j${"Display":"6.78\" AMOLED, 120Hz","Processor":"MediaTek Helio G100","Camera":"108MP + 2MP","Battery":"5000 mAh, 45W","Operating system":"Android 14, XOS 14.5"}$j$::jsonb, '{}', 58, true, false, false, true, 930, 4.1, 201, '2026-06-01'
from public.brands b, public.categories c where b.slug = 'infinix' and c.slug = 'budget'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'tecno-spark-30', 'ORB-TECNO-SPARK-30', 'Tecno Spark 30 Pro', b.id, c.id, '[Demo product] A 120Hz AMOLED screen and 108MP camera, built for everyday use.', 46000, 52000,
  $j$[{"name":"Orbit Black","hex":"#202124"},{"name":"Aurora Cloud","hex":"#c9d3dc"}]$j$::jsonb, array['128GB', '256GB'], $j${"Display":"6.78\" AMOLED, 120Hz","Processor":"MediaTek Helio G100","Camera":"108MP + 2MP","Battery":"5000 mAh, 33W","Operating system":"Android 14, HiOS 14"}$j$::jsonb, '{}', 3, true, false, true, true, 700, 4, 117, '2026-05-27'
from public.brands b, public.categories c where b.slug = 'tecno' and c.slug = 'budget'
on conflict (slug) do nothing;

insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)
select 'iphone-15', 'ORB-IPHONE-15', 'Apple iPhone 15', b.id, c.id, '[Demo product] Dynamic Island, a 48MP main camera and USB-C in an aluminium frame.', 239000, 259000,
  $j$[{"name":"Blue","hex":"#a9c1d4"},{"name":"Pink","hex":"#e8cdd0"},{"name":"Black","hex":"#2b2c2e"}]$j$::jsonb, array['128GB', '256GB'], $j${"Display":"6.1\" Super Retina XDR OLED","Processor":"Apple A16 Bionic","Camera":"48MP + 12MP","Battery":"3349 mAh","Operating system":"iOS 17"}$j$::jsonb, '{}', 12, true, false, true, true, 880, 4.6, 244, '2026-02-10'
from public.brands b, public.categories c where b.slug = 'apple' and c.slug = 'mid-range'
on conflict (slug) do nothing;

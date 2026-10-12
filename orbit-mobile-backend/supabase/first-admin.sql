-- first-admin.sql : make ONE existing account the store owner (admin).
-- Run in Supabase Dashboard > SQL Editor, AFTER you have registered that account on the website
-- (and confirmed its email, if confirmations are on). Replace the email below.
-- This works because the SQL Editor is a trusted connection; the website/API can never change roles.

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'owner@example.com');   -- <-- change this

-- Check the result: you should see exactly one row with your email and role = admin.
select p.id, u.email, p.role
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin';

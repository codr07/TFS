-- Migration: 20261014010000_admin_roles_and_storage_bucket.sql
-- Description:
-- 1. Grant explicit admin control to codr.sankha.contact@gmail.com
-- 2. Fix and grant DELETE permissions across all database tables (student_profiles, fee_plans, etc.)
-- 3. Create 'avatars' public storage bucket with full upload/read/delete policies for images

-- ============================================================================
-- 1. ADMIN FUNCTION & PERMISSION ENFORCEMENT
-- ============================================================================

-- Ensure public.is_admin() recognizes codr.sankha.contact@gmail.com unconditionally
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  ) or (
    lower(coalesce((select auth.jwt() ->> 'email'), '')) in (
      'codr.sankha.contact@gmail.com',
      'sankhasubhraghosh7@gmail.com'
    )
  );
$$;

grant execute on function public.is_admin() to public, anon, authenticated;

-- Ensure current_user_role() returns 'admin' for codr.sankha.contact@gmail.com
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when lower(coalesce((select auth.jwt() ->> 'email'), '')) in ('codr.sankha.contact@gmail.com', 'sankhasubhraghosh7@gmail.com') then 'admin'
    else coalesce(
      (select role from public.profiles where id = (select auth.uid()) limit 1),
      'student'
    )
  end;
$$;

grant execute on function public.current_user_role() to public, anon, authenticated;

-- Ensure codr.sankha.contact@gmail.com profile exists with role = 'admin'
insert into public.profiles (id, email, role, full_name, display_name, updated_at)
select id, email, 'admin', 'Sankha Subhra Ghosh', 'Sankha Admin', now()
from auth.users
where lower(email) in ('codr.sankha.contact@gmail.com', 'sankhasubhraghosh7@gmail.com')
on conflict (id) do update set
  role = 'admin',
  updated_at = now();

update public.profiles
set role = 'admin', updated_at = now()
where lower(email) in ('codr.sankha.contact@gmail.com', 'sankhasubhraghosh7@gmail.com');

-- ============================================================================
-- 2. ENABLE UNRESTRICTED ADMIN DELETE ON ALL DATABASE TABLES
-- ============================================================================

-- student_profiles delete
drop policy if exists "student_profiles_admin_delete" on public.student_profiles;
create policy "student_profiles_admin_delete"
on public.student_profiles
for delete
to authenticated
using (public.is_admin());

-- fee_plans delete
drop policy if exists "fee_plans_admin_delete" on public.fee_plans;
create policy "fee_plans_admin_delete"
on public.fee_plans
for delete
to authenticated
using (public.is_admin());

-- curriculum_items delete
drop policy if exists "curriculum_items_admin_delete" on public.curriculum_items;
create policy "curriculum_items_admin_delete"
on public.curriculum_items
for delete
to authenticated
using (public.is_admin());

-- add_ons delete
drop policy if exists "add_ons_admin_delete" on public.add_ons;
create policy "add_ons_admin_delete"
on public.add_ons
for delete
to authenticated
using (public.is_admin());

-- schedule_items delete
drop policy if exists "schedule_items_admin_delete" on public.schedule_items;
create policy "schedule_items_admin_delete"
on public.schedule_items
for delete
to authenticated
using (public.is_admin());

-- discounts delete
drop policy if exists "discounts_admin_delete" on public.discounts;
create policy "discounts_admin_delete"
on public.discounts
for delete
to authenticated
using (public.is_admin());

-- bookings delete
drop policy if exists "bookings_admin_delete" on public.bookings;
create policy "bookings_admin_delete"
on public.bookings
for delete
to authenticated
using (public.is_admin());

-- student_requests delete
drop policy if exists "student_requests_admin_delete" on public.student_requests;
create policy "student_requests_admin_delete"
on public.student_requests
for delete
to authenticated
using (public.is_admin() or student_id = (select auth.uid()));

-- fee_payments delete
create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text unique not null,
  payment_status text not null default 'PENDING VERIFICATION',
  utr text not null default '',
  payer_name text not null default '',
  student_name text not null default '',
  student_email text not null default '',
  phone text default '',
  curriculum text default 'Guitar',
  class_type text default 'Home Visit',
  addons text default 'None',
  amount numeric(10,2) not null default 0,
  notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.fee_payments enable row level security;

drop policy if exists "fee_payments_admin_delete" on public.fee_payments;
create policy "fee_payments_admin_delete"
on public.fee_payments
for delete
to authenticated
using (public.is_admin());

-- payments delete
drop policy if exists "payments_admin_delete" on public.payments;
create policy "payments_admin_delete"
on public.payments
for delete
to authenticated
using (public.is_admin());

-- profiles delete
drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete"
on public.profiles
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- 3. STORAGE BUCKET FOR IMAGES & AVATARS
-- ============================================================================

-- Create public 'avatars' storage bucket if it does not exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Storage RLS Policies
drop policy if exists "avatars_public_select" on storage.objects;
create policy "avatars_public_select"
on storage.objects
for select
to public, anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "avatars_public_insert" on storage.objects;
create policy "avatars_public_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'avatars');

drop policy if exists "avatars_admin_update" on storage.objects;
create policy "avatars_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars');

drop policy if exists "avatars_admin_delete" on storage.objects;
create policy "avatars_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars');

-- Refresh the PostgREST schema cache
notify pgrst, 'reload schema';

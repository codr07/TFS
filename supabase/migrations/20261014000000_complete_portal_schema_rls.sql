-- Migration: 20261014000000_complete_portal_schema_rls.sql
-- Description: Complete schema columns for student_profiles, create fee_payments table, and fix RLS policies for database persistence.

-- 1. Ensure all extended fields exist on public.student_profiles
alter table if exists public.student_profiles
  add column if not exists admission_id text,
  add column if not exists monthly_fee numeric(10,2),
  add column if not exists fee_status text default 'Up to date',
  add column if not exists fee_due_date text,
  add column if not exists preferred_schedule text,
  add column if not exists addons jsonb default '[]'::jsonb,
  add column if not exists profession text,
  add column if not exists address text,
  add column if not exists notes text,
  add column if not exists bio text,
  add column if not exists emergency_contact text,
  add column if not exists emergency_phone text,
  add column if not exists avatar_url text,
  add column if not exists module_progress jsonb default '{}'::jsonb,
  add column if not exists overall_progress_pct integer default 0,
  add column if not exists instructor_feedback text,
  add column if not exists milestone_badges jsonb default '[]'::jsonb,
  add column if not exists last_evaluated_at timestamptz;

-- 2. Create public.fee_payments table if it does not exist
create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text unique not null,
  payment_status text not null default 'PENDING VERIFICATION',
  utr text not null,
  payer_name text not null,
  student_name text not null,
  student_email text not null,
  phone text default '',
  curriculum text default 'Guitar',
  class_type text default 'Home Visit',
  addons text default 'None',
  amount numeric(10,2) not null default 0,
  notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index fee_payments for rapid query lookups by email and reference
create index if not exists fee_payments_student_email_idx on public.fee_payments(student_email);
create index if not exists fee_payments_payment_reference_idx on public.fee_payments(payment_reference);

-- 3. Grant execute on helper functions to public and anon so public reads do not throw 42501
grant execute on function public.is_admin() to public, anon, authenticated;
grant execute on function public.current_user_role() to public, anon, authenticated;

-- 4. Enable RLS on all portal tables
alter table public.student_profiles enable row level security;
alter table public.fee_payments enable row level security;
alter table public.profiles enable row level security;

-- 5. Policies for public.student_profiles
drop policy if exists "student_profiles_self_read" on public.student_profiles;
drop policy if exists "student_profiles_self_update" on public.student_profiles;
drop policy if exists "student_profiles_self_insert" on public.student_profiles;
drop policy if exists "student_profiles_admin_all" on public.student_profiles;

-- Allow students to read their own record (or admin to read all)
create policy "student_profiles_self_read"
on public.student_profiles
for select
to authenticated
using (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  or id = (select auth.uid())
  or public.is_admin()
);

-- Allow students to update their own profile details
create policy "student_profiles_self_update"
on public.student_profiles
for update
to authenticated
using (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  or id = (select auth.uid())
  or public.is_admin()
)
with check (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  or id = (select auth.uid())
  or public.is_admin()
);

-- Allow inserting student profile during onboarding or self-registration
create policy "student_profiles_self_insert"
on public.student_profiles
for insert
to anon, authenticated
with check (
  public.is_admin()
  or lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), email))
);

-- Allow admins full access
create policy "student_profiles_admin_all"
on public.student_profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 6. Policies for public.fee_payments
drop policy if exists "fee_payments_public_insert" on public.fee_payments;
drop policy if exists "fee_payments_self_read" on public.fee_payments;
drop policy if exists "fee_payments_admin_all" on public.fee_payments;

-- Anyone can submit a fee payment (students paying tuition)
create policy "fee_payments_public_insert"
on public.fee_payments
for insert
to anon, authenticated
with check (true);

-- Students can read their own fee receipts
create policy "fee_payments_self_read"
on public.fee_payments
for select
to authenticated
using (
  lower(student_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  or public.is_admin()
);

-- Admin can manage all fee payment records
create policy "fee_payments_admin_all"
on public.fee_payments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 7. Policies for public.profiles (allow users to update their own profile)
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

-- Refresh the PostgREST schema cache
notify pgrst, 'reload schema';

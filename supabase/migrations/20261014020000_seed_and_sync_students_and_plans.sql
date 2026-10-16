-- Migration: 20261014020000_seed_and_sync_students_and_plans.sql
-- Description:
-- 1. Ensure public.student_plans, public.student_profiles, public.student_data, and public.students_data are created, fully structured, and permissive.
-- 2. Drop restrictive foreign keys that blocked inserting plans for non-auth student records.
-- 3. Seed active student roster, enrolled student plans, and student data in all tables so they are never empty.

-- ============================================================================
-- 1. STUDENT PROFILES COLUMNS & RLS
-- ============================================================================

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone_number text,
  curriculum text not null default 'Guitar',
  class_schedule text,
  preferred_schedule text,
  monthly_fee numeric(10,2) default 1300,
  fee_status text default 'Up to date',
  fee_due_date text,
  addons jsonb default '[]'::jsonb,
  profession text,
  address text,
  bio text,
  notes text,
  emergency_contact text,
  emergency_phone text,
  avatar_url text,
  module_progress jsonb default '{}'::jsonb,
  overall_progress_pct integer default 0,
  instructor_feedback text,
  milestone_badges jsonb default '[]'::jsonb,
  last_evaluated_at timestamptz,
  admission_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all columns exist in student_profiles
alter table public.student_profiles add column if not exists phone_number text;
alter table public.student_profiles add column if not exists curriculum text default 'Guitar';
alter table public.student_profiles add column if not exists class_schedule text;
alter table public.student_profiles add column if not exists preferred_schedule text;
alter table public.student_profiles add column if not exists monthly_fee numeric(10,2) default 1300;
alter table public.student_profiles add column if not exists fee_status text default 'Up to date';
alter table public.student_profiles add column if not exists fee_due_date text;
alter table public.student_profiles add column if not exists addons jsonb default '[]'::jsonb;
alter table public.student_profiles add column if not exists profession text;
alter table public.student_profiles add column if not exists address text;
alter table public.student_profiles add column if not exists bio text;
alter table public.student_profiles add column if not exists notes text;
alter table public.student_profiles add column if not exists emergency_contact text;
alter table public.student_profiles add column if not exists emergency_phone text;
alter table public.student_profiles add column if not exists avatar_url text;
alter table public.student_profiles add column if not exists module_progress jsonb default '{}'::jsonb;
alter table public.student_profiles add column if not exists overall_progress_pct integer default 0;
alter table public.student_profiles add column if not exists instructor_feedback text;
alter table public.student_profiles add column if not exists milestone_badges jsonb default '[]'::jsonb;
alter table public.student_profiles add column if not exists last_evaluated_at timestamptz;
alter table public.student_profiles add column if not exists admission_id text;
alter table public.student_profiles add column if not exists status text default 'active';

alter table public.student_profiles enable row level security;

-- Policies on student_profiles
drop policy if exists "student_profiles_read_all" on public.student_profiles;
create policy "student_profiles_read_all"
on public.student_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "student_profiles_admin_write" on public.student_profiles;
create policy "student_profiles_admin_write"
on public.student_profiles
for all
to authenticated
using (public.is_admin() or auth.uid() = id)
with check (public.is_admin() or auth.uid() = id);

-- ============================================================================
-- 2. STUDENT PLANS (FLEXIBLE FOREIGN KEYS & RLS)
-- ============================================================================

create table if not exists public.student_plans (
  student_id uuid primary key,
  plan_id uuid,
  instrument text,
  format text,
  schedule_text text,
  status text not null default 'active',
  updated_at timestamptz not null default now()
);

-- Ensure foreign keys do not block admin management
alter table public.student_plans drop constraint if exists student_plans_student_id_fkey;
alter table public.student_plans drop constraint if exists student_plans_plan_id_fkey;

alter table public.student_plans add column if not exists instrument text;
alter table public.student_plans add column if not exists format text;
alter table public.student_plans add column if not exists schedule_text text;
alter table public.student_plans add column if not exists status text default 'active';
alter table public.student_plans add column if not exists updated_at timestamptz default now();

alter table public.student_plans enable row level security;

drop policy if exists "student_plans_select_all" on public.student_plans;
create policy "student_plans_select_all"
on public.student_plans
for select
to anon, authenticated
using (true);

drop policy if exists "student_plans_admin_manage" on public.student_plans;
create policy "student_plans_admin_manage"
on public.student_plans
for all
to anon, authenticated
using (true)
with check (true);

-- ============================================================================
-- 3. STUDENT_DATA & STUDENTS_DATA
-- ============================================================================

create table if not exists public.student_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  student_name text,
  email text,
  phone_number text,
  instrument text,
  monthly_fee numeric(10,2) default 1300,
  format text,
  schedule_text text,
  status text default 'active',
  updated_at timestamptz default now()
);

alter table public.student_data add column if not exists user_id uuid;
alter table public.student_data add column if not exists student_name text;
alter table public.student_data add column if not exists email text;
alter table public.student_data add column if not exists phone_number text;
alter table public.student_data add column if not exists instrument text;
alter table public.student_data add column if not exists monthly_fee numeric(10,2) default 1300;
alter table public.student_data add column if not exists format text;
alter table public.student_data add column if not exists schedule_text text;
alter table public.student_data add column if not exists status text default 'active';
alter table public.student_data add column if not exists updated_at timestamptz default now();

alter table public.student_data enable row level security;

drop policy if exists "student_data_all_access" on public.student_data;
create policy "student_data_all_access"
on public.student_data
for all
to anon, authenticated
using (true)
with check (true);

-- Create students_data view if students_data table does not exist
do $$
begin
  if not exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'students_data'
  ) then
    create or replace view public.students_data as
    select 
      id,
      first_name,
      last_name,
      email,
      phone_number,
      curriculum,
      class_schedule,
      preferred_schedule,
      monthly_fee,
      fee_status,
      fee_due_date,
      status,
      avatar_url,
      created_at,
      updated_at
    from public.student_profiles;
  end if;
end $$;

grant select on public.students_data to public, anon, authenticated;

-- ============================================================================
-- 4. SEED ACTIVE STUDENTS, PLANS, AND DATA
-- ============================================================================

-- Remove all mock / non-Sankha entries across all student tables
delete from public.student_profiles where id != 'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d';
delete from public.student_plans where student_id != 'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d';
delete from public.student_data where id != 'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d';
delete from public.profiles
where
  id in (
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
  )
  or email in (
    'aarav.sharma@example.com',
    'ananya.sen@example.com',
    'rohan.mehta@example.com',
    'priya.nair@example.com'
  );

-- Seed Student Profiles (Sankha Saha ONLY)
insert into public.student_profiles (
  id, first_name, last_name, email, phone_number,
  curriculum, class_schedule, preferred_schedule, monthly_fee,
  fee_status, fee_due_date, profession, address, status,
  overall_progress_pct, instructor_feedback, created_at, updated_at
) values (
  'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
  'Sankha', 'Saha', 'codr.sankha.contact@gmail.com', '+91 91234 56789',
  'Guitar', 'Home Visit — ₹1,500/month', 'Weekend Flexible', 1500,
  'Up to date', '1st of every month', 'Student', 'Bengaluru, India', 'active',
  100, 'Master level certification; classical harmony and acoustic compositions.', now() - interval '90 days', now()
)
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  curriculum = excluded.curriculum,
  class_schedule = excluded.class_schedule,
  preferred_schedule = excluded.preferred_schedule,
  monthly_fee = excluded.monthly_fee,
  fee_status = excluded.fee_status,
  status = excluded.status,
  updated_at = now();

-- Seed Student Plans (Sankha Saha ONLY)
insert into public.student_plans (
  student_id, instrument, format, schedule_text, status, updated_at
) values (
  'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
  'Guitar', 'Home Visit', 'Weekend Flexible', 'active', now()
)
on conflict (student_id) do update set
  instrument = excluded.instrument,
  format = excluded.format,
  schedule_text = excluded.schedule_text,
  status = excluded.status,
  updated_at = now();

-- Seed Student Data (Sankha Saha ONLY)
insert into public.student_data (
  id, user_id, student_name, email, phone_number, instrument, monthly_fee, format, schedule_text, status, updated_at
) values (
  'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
  'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
  'Sankha Saha', 'codr.sankha.contact@gmail.com', '+91 91234 56789', 'Guitar', 1500, 'Home Visit', 'Weekend Flexible', 'active', now()
)
on conflict (id) do update set
  user_id = excluded.user_id,
  student_name = excluded.student_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  instrument = excluded.instrument,
  monthly_fee = excluded.monthly_fee,
  format = excluded.format,
  schedule_text = excluded.schedule_text,
  status = excluded.status,
  updated_at = now();

-- Ensure profiles table has corresponding entry for Sankha Saha with admin role
insert into public.profiles (id, email, full_name, display_name, role, updated_at)
values (
  'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
  'codr.sankha.contact@gmail.com',
  'Sankha Saha',
  'Sankha Saha',
  'admin',
  now()
)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  display_name = excluded.display_name,
  role = 'admin',
  updated_at = now();

notify pgrst, 'reload schema';

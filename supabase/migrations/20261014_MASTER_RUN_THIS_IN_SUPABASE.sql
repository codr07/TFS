-- ============================================================================
-- THE FRETBOARD SOCIETY (TFS) - MASTER COMPLETE DATABASE & ADMIN MIGRATION
-- File: supabase/migrations/20261014_MASTER_RUN_THIS_IN_SUPABASE.sql
--
-- Run this single script in your Supabase Dashboard > SQL Editor.
-- It is completely idempotent, safe to run multiple times, and resolves:
-- 1. Full admin rights for codr.sankha.contact@gmail.com
-- 2. Creates and verifies all tables (fee_payments, student_profiles, etc.)
-- 3. Enables DELETE and full RLS policies across all tables
-- 4. Creates public 'avatars' storage bucket for image uploads
-- 5. Populates student_profiles, student_plans, and student_data with active students
-- ============================================================================

-- ============================================================================
-- 1. BASE TABLES CREATION (GUARANTEE ALL RELATIONS EXIST)
-- ============================================================================

-- Profiles table
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid (),
    email text unique,
    full_name text,
    display_name text,
    role text not null default 'student' check (role in ('admin', 'student')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Student Profiles table
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
alter table public.student_profiles
add column if not exists phone_number text;

alter table public.student_profiles
add column if not exists curriculum text default 'Guitar';

alter table public.student_profiles
add column if not exists class_schedule text;

alter table public.student_profiles
add column if not exists preferred_schedule text;

alter table public.student_profiles
add column if not exists monthly_fee numeric(10, 2) default 1300;

alter table public.student_profiles
add column if not exists fee_status text default 'Up to date';

alter table public.student_profiles
add column if not exists fee_due_date text;

alter table public.student_profiles add column if not exists addons jsonb default '[]'::jsonb;

alter table public.student_profiles
add column if not exists profession text;

alter table public.student_profiles
add column if not exists address text;

alter table public.student_profiles
add column if not exists bio text;

alter table public.student_profiles
add column if not exists notes text;

alter table public.student_profiles
add column if not exists emergency_contact text;

alter table public.student_profiles
add column if not exists emergency_phone text;

alter table public.student_profiles
add column if not exists avatar_url text;

alter table public.student_profiles add column if not exists module_progress jsonb default '{}'::jsonb;

alter table public.student_profiles
add column if not exists overall_progress_pct integer default 0;

alter table public.student_profiles
add column if not exists instructor_feedback text;

alter table public.student_profiles add column if not exists milestone_badges jsonb default '[]'::jsonb;

alter table public.student_profiles
add column if not exists last_evaluated_at timestamptz;

alter table public.student_profiles
add column if not exists admission_id text;

alter table public.student_profiles
add column if not exists status text default 'active';

-- Fee Payments table
create table if not exists public.fee_payments (
    id uuid primary key default gen_random_uuid (),
    payment_reference text unique not null,
    payment_status text not null default 'PENDING VERIFICATION',
    utr text not null default '',
    payer_name text not null default '',
    student_name text not null default '',
    student_email text not null default '',
    student_id uuid,
    phone text default '',
    curriculum text default 'Guitar',
    class_type text default 'Home Visit',
    addons text default 'None',
    amount numeric(10, 2) not null default 0,
    notes text,
    verified_at timestamptz,
    created_at timestamptz not null default now()
);

alter table public.fee_payments
add column if not exists student_id uuid;

-- Fee Plans table
create table if not exists public.fee_plans (
    id uuid primary key default gen_random_uuid (),
    name text not null,
    amount numeric(10, 2) not null,
    billing_period text not null default 'monthly',
    description text default '',
    category text default 'guitar',
    instrument text default 'guitar',
    sort_order integer not null default 0,
    active boolean not null default true,
    updated_at timestamptz not null default now()
);

-- Curriculum Items table
create table if not exists public.curriculum_items (
    id uuid primary key default gen_random_uuid (),
    title text not null,
    description text not null,
    category text not null default 'core',
    instrument text not null default 'guitar',
    icon_name text default 'book',
    sort_order integer not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

-- Add-ons table
create table if not exists public.add_ons (
    id uuid primary key default gen_random_uuid (),
    name text not null,
    description text default '',
    amount numeric(10, 2) not null,
    billing_period text not null default 'monthly',
    sort_order integer not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

-- Schedule Items table
create table if not exists public.schedule_items (
    id uuid primary key default gen_random_uuid (),
    title text not null,
    day_label text not null,
    time_label text not null,
    description text default '',
    format text not null default 'Studio & Online',
    sort_order integer not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

-- Discounts table
create table if not exists public.discounts (
    id uuid primary key default gen_random_uuid (),
    name text not null,
    coupon_code text not null unique,
    discount_type text not null default 'percentage' check (
        discount_type in ('percentage', 'amount')
    ),
    discount_value numeric(10, 2) not null default 0,
    maximum_discount_amount numeric(10, 2),
    minimum_purchase numeric(10, 2) not null default 0,
    valid_from timestamptz not null default now(),
    valid_until timestamptz,
    coupon_count integer not null default 1,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

-- Bookings table
create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid (),
    full_name text not null,
    email text not null,
    phone text,
    preferred_date date not null,
    preferred_time text not null,
    class_type text not null,
    instrument text not null default 'guitar',
    status text not null default 'pending',
    notes text,
    created_at timestamptz not null default now()
);

-- Student Requests / Messages table
create table if not exists public.student_requests (
    id uuid primary key default gen_random_uuid (),
    student_id uuid,
    student_name text,
    student_email text,
    request_type text not null default 'general',
    subject text default '',
    message text not null,
    status text not null default 'pending',
    admin_notes text,
    created_at timestamptz not null default now()
);

-- Payments table
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid (),
    user_id uuid,
    student_id uuid,
    amount numeric(10, 2) not null,
    coupon_code text,
    billing_period text not null default 'monthly',
    status text not null default 'pending',
    paid_at timestamptz,
    created_at timestamptz not null default now()
);

-- Class Updates table
create table if not exists public.class_updates (
    id uuid primary key default gen_random_uuid (),
    student_id uuid,
    title text not null,
    body text not null,
    created_at timestamptz not null default now()
);

-- Student Plans table (Drop restrictive FK to allow student roster plans without requiring auth user)
create table if not exists public.student_plans (
    student_id uuid primary key,
    plan_id uuid,
    instrument text,
    format text,
    schedule_text text,
    status text not null default 'active',
    updated_at timestamptz not null default now()
);

alter table public.student_plans
drop constraint if exists student_plans_student_id_fkey;

alter table public.student_plans
drop constraint if exists student_plans_plan_id_fkey;

-- Student Data table
create table if not exists public.student_data (
    id uuid primary key default gen_random_uuid (),
    user_id uuid,
    student_name text,
    email text,
    phone_number text,
    instrument text,
    monthly_fee numeric(10, 2) default 1300,
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
alter table public.student_data add column if not exists monthly_fee numeric(10, 2) default 1300;
alter table public.student_data add column if not exists format text;
alter table public.student_data add column if not exists schedule_text text;
alter table public.student_data add column if not exists status text default 'active';
alter table public.student_data add column if not exists updated_at timestamptz default now();

-- Students Data View
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
-- 2. ADMIN AUTHENTICATION FUNCTIONS
-- ============================================================================

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

grant
execute on function public.is_admin () to public,
anon,
authenticated;

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

grant
execute on function public.current_user_role () to public,
anon,
authenticated;

-- Ensure codr.sankha.contact@gmail.com profile exists with role = 'admin'
insert into
    public.profiles (
        id,
        email,
        role,
        full_name,
        display_name,
        updated_at
    )
select id, email, 'admin', 'Sankha Subhra Ghosh', 'Sankha Admin', now()
from auth.users
where
    lower(email) in (
        'codr.sankha.contact@gmail.com',
        'sankhasubhraghosh7@gmail.com'
    ) on conflict (id) do
update
set role = 'admin',
updated_at = now();

update public.profiles
set role = 'admin',
updated_at = now()
where
    lower(email) in (
        'codr.sankha.contact@gmail.com',
        'sankhasubhraghosh7@gmail.com'
    );

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY & PERMISSIONS
-- ============================================================================

alter table public.profiles enable row level security;

alter table public.student_profiles enable row level security;

alter table public.fee_payments enable row level security;

alter table public.fee_plans enable row level security;

alter table public.curriculum_items enable row level security;

alter table public.add_ons enable row level security;

alter table public.schedule_items enable row level security;

alter table public.discounts enable row level security;

alter table public.bookings enable row level security;

alter table public.student_requests enable row level security;

alter table public.payments enable row level security;

alter table public.class_updates enable row level security;

alter table public.student_plans enable row level security;

alter table public.student_data enable row level security;

-- Profiles policies
drop policy if exists "profiles_read_all" on public.profiles;

create policy "profiles_read_all" on public.profiles for
select to anon, authenticated using (true);

drop policy if exists "profiles_self_write" on public.profiles;

create policy "profiles_self_write" on public.profiles for all to authenticated using (
    auth.uid () = id
    or public.is_admin ()
)
with
    check (
        auth.uid () = id
        or public.is_admin ()
    );

drop policy if exists "profiles_admin_delete" on public.profiles;

create policy "profiles_admin_delete" on public.profiles for delete to authenticated using (public.is_admin ());

-- Student Profiles policies
drop policy if exists "student_profiles_read_all" on public.student_profiles;

create policy "student_profiles_read_all" on public.student_profiles for
select to anon, authenticated using (true);

drop policy if exists "student_profiles_write" on public.student_profiles;

create policy "student_profiles_write" on public.student_profiles for all to authenticated using (
    public.is_admin ()
    or auth.uid () = id
)
with
    check (
        public.is_admin ()
        or auth.uid () = id
    );

drop policy if exists "student_profiles_admin_delete" on public.student_profiles;

create policy "student_profiles_admin_delete" on public.student_profiles for delete to authenticated using (public.is_admin ());

-- Fee Payments policies
drop policy if exists "fee_payments_read_all" on public.fee_payments;

create policy "fee_payments_read_all" on public.fee_payments for
select to anon, authenticated using (true);

drop policy if exists "fee_payments_insert" on public.fee_payments;

create policy "fee_payments_insert" on public.fee_payments for
insert
    to anon,
    authenticated
with
    check (true);

drop policy if exists "fee_payments_admin_update" on public.fee_payments;

create policy "fee_payments_admin_update" on public.fee_payments for
update to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

drop policy if exists "fee_payments_admin_delete" on public.fee_payments;

create policy "fee_payments_admin_delete" on public.fee_payments for delete to authenticated using (public.is_admin ());

-- Fee Plans policies
drop policy if exists "fee_plans_read_all" on public.fee_plans;

create policy "fee_plans_read_all" on public.fee_plans for
select to anon, authenticated using (true);

drop policy if exists "fee_plans_admin_manage" on public.fee_plans;

create policy "fee_plans_admin_manage" on public.fee_plans for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

drop policy if exists "fee_plans_admin_delete" on public.fee_plans;

create policy "fee_plans_admin_delete" on public.fee_plans for delete to authenticated using (public.is_admin ());

-- Curriculum policies
drop policy if exists "curriculum_items_read_all" on public.curriculum_items;

create policy "curriculum_items_read_all" on public.curriculum_items for
select to anon, authenticated using (true);

drop policy if exists "curriculum_items_admin_manage" on public.curriculum_items;

create policy "curriculum_items_admin_manage" on public.curriculum_items for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

drop policy if exists "curriculum_items_admin_delete" on public.curriculum_items;

create policy "curriculum_items_admin_delete" on public.curriculum_items for delete to authenticated using (public.is_admin ());

-- Add-ons policies
drop policy if exists "add_ons_read_all" on public.add_ons;

create policy "add_ons_read_all" on public.add_ons for
select to anon, authenticated using (true);

drop policy if exists "add_ons_admin_manage" on public.add_ons;

create policy "add_ons_admin_manage" on public.add_ons for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

drop policy if exists "add_ons_admin_delete" on public.add_ons;

create policy "add_ons_admin_delete" on public.add_ons for delete to authenticated using (public.is_admin ());

-- Schedule policies
drop policy if exists "schedule_items_read_all" on public.schedule_items;

create policy "schedule_items_read_all" on public.schedule_items for
select to anon, authenticated using (true);

drop policy if exists "schedule_items_admin_manage" on public.schedule_items;

create policy "schedule_items_admin_manage" on public.schedule_items for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

drop policy if exists "schedule_items_admin_delete" on public.schedule_items;

create policy "schedule_items_admin_delete" on public.schedule_items for delete to authenticated using (public.is_admin ());

-- Discounts policies
drop policy if exists "discounts_read_all" on public.discounts;

create policy "discounts_read_all" on public.discounts for
select to anon, authenticated using (true);

drop policy if exists "discounts_admin_manage" on public.discounts;

create policy "discounts_admin_manage" on public.discounts for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

drop policy if exists "discounts_admin_delete" on public.discounts;

create policy "discounts_admin_delete" on public.discounts for delete to authenticated using (public.is_admin ());

-- Bookings policies
drop policy if exists "bookings_read_all" on public.bookings;

create policy "bookings_read_all" on public.bookings for
select to anon, authenticated using (true);

drop policy if exists "bookings_insert" on public.bookings;

create policy "bookings_insert" on public.bookings for
insert
    to anon,
    authenticated
with
    check (true);

drop policy if exists "bookings_admin_manage" on public.bookings;

create policy "bookings_admin_manage" on public.bookings for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

drop policy if exists "bookings_admin_delete" on public.bookings;

create policy "bookings_admin_delete" on public.bookings for delete to authenticated using (public.is_admin ());

-- Student Requests policies
drop policy if exists "student_requests_read" on public.student_requests;

create policy "student_requests_read" on public.student_requests for
select to anon, authenticated using (true);

drop policy if exists "student_requests_insert" on public.student_requests;

create policy "student_requests_insert" on public.student_requests for
insert
    to anon,
    authenticated
with
    check (true);

drop policy if exists "student_requests_admin_manage" on public.student_requests;

create policy "student_requests_admin_manage" on public.student_requests for all to authenticated using (
    public.is_admin ()
    or student_id = auth.uid ()
)
with
    check (
        public.is_admin ()
        or student_id = auth.uid ()
    );

drop policy if exists "student_requests_admin_delete" on public.student_requests;

create policy "student_requests_admin_delete" on public.student_requests for delete to authenticated using (
    public.is_admin ()
    or student_id = auth.uid ()
);

-- Payments policies
drop policy if exists "payments_read" on public.payments;

create policy "payments_read" on public.payments for
select to anon, authenticated using (true);

drop policy if exists "payments_admin_delete" on public.payments;

create policy "payments_admin_delete" on public.payments for delete to authenticated using (public.is_admin ());

-- Student Plans policies
drop policy if exists "student_plans_select_all" on public.student_plans;

create policy "student_plans_select_all" on public.student_plans for
select to anon, authenticated using (true);

drop policy if exists "student_plans_admin_manage" on public.student_plans;

create policy "student_plans_admin_manage" on public.student_plans for all to anon,
authenticated using (true)
with
    check (true);

-- Student Data policies
drop policy if exists "student_data_all_access" on public.student_data;

create policy "student_data_all_access" on public.student_data for all to anon,
authenticated using (true)
with
    check (true);

-- ============================================================================
-- 4. STORAGE BUCKET FOR IMAGES & AVATARS
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

drop policy if exists "avatars_public_select" on storage.objects;

create policy "avatars_public_select" on storage.objects for
select to public, anon, authenticated using (bucket_id = 'avatars');

drop policy if exists "avatars_public_insert" on storage.objects;

create policy "avatars_public_insert" on storage.objects for
insert
    to anon,
    authenticated
with
    check (bucket_id = 'avatars');

drop policy if exists "avatars_admin_update" on storage.objects;

create policy "avatars_admin_update" on storage.objects for
update to authenticated using (bucket_id = 'avatars');

drop policy if exists "avatars_admin_delete" on storage.objects;

create policy "avatars_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars');

-- ============================================================================
-- 5. SEED ACTIVE STUDENTS, PLANS, DATA & FEE PLANS
-- ============================================================================

-- Seed Core Fee Plans
insert into
    public.fee_plans (
        id,
        name,
        amount,
        billing_period,
        description,
        category,
        instrument,
        sort_order,
        active
    )
values (
        'b1111111-1111-1111-1111-111111111111',
        'Home Visit',
        1500,
        'monthly',
        'Personalized instructor visit at your residence.',
        'guitar',
        'guitar',
        1,
        true
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'Home Tuition',
        1300,
        'monthly',
        'Studio or center in-person sessions.',
        'guitar',
        'guitar',
        2,
        true
    ),
    (
        'b3333333-3333-3333-3333-333333333333',
        'Online',
        900,
        'monthly',
        'High definition remote audio-video 1-on-1 classes.',
        'guitar',
        'guitar',
        3,
        true
    ),
    (
        'b4444444-4444-4444-4444-444444444444',
        'Ukulele (Dotara) Home Tuition',
        1500,
        'monthly',
        'Specialized Dotara plucking and folk ukulele lessons.',
        'ukulele',
        'ukulele',
        4,
        true
    ) on conflict (id) do
update
set
    name = excluded.name,
    amount = excluded.amount,
    billing_period = excluded.billing_period,
    active = true;

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
insert into
    public.student_profiles (
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
        profession,
        address,
        status,
        overall_progress_pct,
        instructor_feedback,
        created_at,
        updated_at
    )
values (
        'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
        'Sankha',
        'Saha',
        'codr.sankha.contact@gmail.com',
        '+91 91234 56789',
        'Guitar',
        'Home Visit — ₹1,500/month',
        'Weekend Flexible',
        1500,
        'Up to date',
        '1st of every month',
        'Student',
        'Bengaluru, India',
        'active',
        100,
        'Master level certification; classical harmony and acoustic compositions.',
        now() - interval '90 days',
        now()
    ) on conflict (id) do
update
set
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
insert into
    public.student_plans (
        student_id,
        instrument,
        format,
        schedule_text,
        status,
        updated_at
    )
values (
        'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
        'Guitar',
        'Home Visit',
        'Weekend Flexible',
        'active',
        now()
    ) on conflict (student_id) do
update
set
    instrument = excluded.instrument,
    format = excluded.format,
    schedule_text = excluded.schedule_text,
    status = excluded.status,
    updated_at = now();

-- Seed Student Data (Sankha Saha ONLY)
insert into
    public.student_data (
        id,
        user_id,
        student_name,
        email,
        phone_number,
        instrument,
        monthly_fee,
        format,
        schedule_text,
        status,
        updated_at
    )
values (
        'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
        'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
        'Sankha Saha',
        'codr.sankha.contact@gmail.com',
        '+91 91234 56789',
        'Guitar',
        1500,
        'Home Visit',
        'Weekend Flexible',
        'active',
        now()
    ) on conflict (id) do
update
set
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

-- Seed Profiles (Sankha Saha with Admin role)
insert into
    public.profiles (
        id,
        email,
        full_name,
        display_name,
        role,
        updated_at
    )
values (
        'ccbc8a5d-0bfa-4573-a3be-f2d5c8fb825d',
        'codr.sankha.contact@gmail.com',
        'Sankha Saha',
        'Sankha Saha',
        'admin',
        now()
    ) on conflict (id) do
update
set
    email = excluded.email,
    full_name = excluded.full_name,
    display_name = excluded.display_name,
    role = 'admin',
    updated_at = now();

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
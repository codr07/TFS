-- Portal roles and LMS data model.
-- Apply this migration to the Supabase project configured in .env.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'student'));
exception
  when duplicate_object then null;
end $$;

insert into public.profiles (id, display_name, role)
select u.id, split_part(u.email, '@', 1),
  case u.email
    when 'codr.sankha.contact@gmail.com' then 'admin'
    when 'sankhasaha420@gmail.com' then 'student'
  end
from auth.users u
where u.email in ('codr.sankha.contact@gmail.com', 'sankhasaha420@gmail.com')
on conflict (id) do update
set role = excluded.role,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
from public.profiles p
where p.id = u.id
  and p.role in ('admin', 'student');

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
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles
  where id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  instrument text,
  format text,
  slot text,
  status text not null default 'new',
  admin_reply text,
  created_at timestamptz not null default now()
);

alter table public.bookings add column if not exists admin_reply text;

create table if not exists public.student_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  student_name text,
  student_email text,
  request_type text not null,
  message text not null,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_requests add column if not exists student_name text;
alter table public.student_requests add column if not exists student_email text;

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone_number text,
  curriculum text not null default 'Guitar',
  class_schedule text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles add column if not exists first_name text;
alter table public.student_profiles add column if not exists last_name text;
alter table public.student_profiles add column if not exists email text;
alter table public.student_profiles add column if not exists phone_number text;
alter table public.student_profiles add column if not exists curriculum text default 'Guitar';
alter table public.student_profiles add column if not exists class_schedule text;
alter table public.student_profiles add column if not exists status text default 'active';
alter table public.student_profiles add column if not exists created_at timestamptz not null default now();
alter table public.student_profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  content jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.site_content add column if not exists page_key text;
alter table public.site_content add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.site_content add column if not exists updated_by uuid references auth.users(id);
alter table public.site_content add column if not exists updated_at timestamptz not null default now();

create table if not exists public.fee_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(10,2) not null,
  billing_period text not null default 'monthly',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.fee_plans add column if not exists name text;
alter table public.fee_plans add column if not exists amount numeric(10,2);
alter table public.fee_plans add column if not exists billing_period text default 'monthly';
alter table public.fee_plans add column if not exists active boolean not null default true;
alter table public.fee_plans add column if not exists updated_at timestamptz not null default now();
alter table public.fee_plans add column if not exists description text;
alter table public.fee_plans add column if not exists sort_order integer not null default 0;
alter table public.fee_plans add column if not exists category text default 'guitar';
alter table public.fee_plans add column if not exists instrument text default 'guitar';

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  coupon_code text not null unique,
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'amount')),
  discount_value numeric(10,2) not null default 0,
  maximum_discount_amount numeric(10,2),
  minimum_purchase numeric(10,2) not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  coupon_count integer not null default 1,
  description text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.discounts add column if not exists coupon_code text;
alter table public.discounts add column if not exists name text;
alter table public.discounts add column if not exists discount_type text default 'percentage';
alter table public.discounts add column if not exists discount_value numeric(10,2) default 0;
alter table public.discounts add column if not exists maximum_discount_amount numeric(10,2);
alter table public.discounts add column if not exists minimum_purchase numeric(10,2) default 0;
alter table public.discounts add column if not exists valid_from timestamptz default now();
alter table public.discounts add column if not exists valid_until timestamptz;
alter table public.discounts add column if not exists coupon_count integer default 1;
alter table public.discounts add column if not exists description text;
alter table public.discounts add column if not exists active boolean not null default true;
alter table public.discounts add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.discounts add constraint discounts_type_check check (discount_type in ('percentage', 'amount'));
exception
  when duplicate_object then null;
end $$;

insert into public.discounts (name, coupon_code, discount_type, discount_value, maximum_discount_amount, minimum_purchase, valid_from, valid_until, coupon_count, description, active)
select seed.name, seed.coupon_code, seed.discount_type, seed.discount_value, seed.maximum_discount_amount, seed.minimum_purchase, now() - interval '30 days', now() + interval '180 days', seed.coupon_count, seed.description, true
from (values
  ('Referral welcome', 'TFSREFERRAL', 'percentage', 10, 500, 0, '2026-01-01', '2027-12-31', 50, 'Apply for a first-time referral discount.', true),
  ('New student launch', 'TFSLAUNCH', 'amount', 300, 300, 1500, '2026-01-01', '2027-12-31', 25, 'Flat ₹300 off qualifying tuition purchases.', true),
  ('Weekend bonus', 'TFSWEEKEND', 'percentage', 15, 700, 2000, '2026-01-01', '2027-12-31', 20, 'Weekend enrolment discount for 2k+ purchases.', true)
) as seed(name, coupon_code, discount_type, discount_value, maximum_discount_amount, minimum_purchase, valid_from, valid_until, coupon_count, description, active)
where not exists (select 1 from public.discounts d where d.coupon_code = seed.coupon_code);

create table if not exists public.add_ons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  amount numeric(10,2) not null,
  billing_period text not null default 'monthly',
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.add_ons add column if not exists name text;
alter table public.add_ons add column if not exists description text;
alter table public.add_ons add column if not exists amount numeric(10,2);
alter table public.add_ons add column if not exists billing_period text default 'monthly';
alter table public.add_ons add column if not exists active boolean not null default true;
alter table public.add_ons add column if not exists sort_order integer not null default 0;
alter table public.add_ons add column if not exists updated_at timestamptz not null default now();

insert into public.add_ons (name, description, amount, billing_period, sort_order)
select seed.name, seed.description, seed.amount, 'monthly', seed.sort_order
from (values
  ('Songwriting', 'Includes music theory.', 500::numeric, 0),
  ('Music Composing', 'No software training.', 1500::numeric, 1)
) as seed(name, description, amount, sort_order)
where not exists (select 1 from public.add_ons);

insert into public.fee_plans (name, amount, description, billing_period, sort_order)
select seed.name, seed.amount, seed.description, 'monthly', seed.sort_order
from (values
  ('Home Visit', 1500::numeric, 'Personalized guitar instruction at your location.', 0),
  ('Tuition', 1300::numeric, 'Focused one-to-one instruction at the designated learning location.', 1),
  ('Online', 900::numeric, 'Structured individual guitar lessons from anywhere.', 2)
) as seed(name, amount, description, sort_order)
where not exists (select 1 from public.fee_plans);

update public.fee_plans
set name = 'Home Tuition',
    description = 'One-to-one guitar or Standard Ukulele instruction at the designated learning location.',
    category = 'home_tuition',
    instrument = 'guitar'
where name = 'Tuition';

update public.fee_plans
set description = 'Personalized one-to-one guitar or Standard Ukulele instruction at your location.',
    category = 'home_visit',
    instrument = 'guitar'
where name = 'Home Visit';

update public.fee_plans
set description = 'Structured one-to-one guitar or Standard Ukulele lessons online.',
    category = 'online_tuition',
    instrument = 'guitar'
where name = 'Online';

insert into public.fee_plans (name, amount, description, billing_period, category, instrument, sort_order)
select 'Ukulele (Dotara) Home Tuition', 1500, 'Specialized Dotara Ukulele instruction. Home Tuition only; online classes are not available.', 'monthly', 'dotara_home_tuition', 'ukulele_dotara', 3
where not exists (select 1 from public.fee_plans where instrument = 'ukulele_dotara');

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  day_label text not null,
  time_label text not null,
  format text,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.curriculum_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default 'core',
  instrument text not null default 'guitar',
  icon_name text,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.curriculum_items add column if not exists instrument text default 'guitar';
update public.curriculum_items set instrument = 'guitar' where instrument is null;

update public.curriculum_items
set active = false
where instrument = 'guitar'
  and title in ('Music Theory', 'Chords', 'Scales', 'Fingerstyle', 'Songwriting & Notation');

insert into public.curriculum_items (title, description, category, instrument, icon_name, sort_order)
select seed.title, seed.description, seed.category, seed.instrument, seed.icon_name, seed.sort_order
from (values
  ('Beginner (Chords)', 'Build foundational chords, clean transitions, rhythm control and confident song accompaniment.', 'beginner', 'guitar', 'target', 0),
  ('Fingerstyle', 'Develop thumb-and-finger independence, picking patterns, coordination and musical expression.', 'fingerstyle', 'guitar', 'guitar', 1),
  ('Intermediate (1. + 2.)', 'Combine the Beginner chord pathway and Fingerstyle pathway into fluent musical playing.', 'intermediate', 'guitar', 'music', 2),
  ('Advanced (Advance Chords)', 'Master advanced chord shapes, extensions, reharmonization and harmonic control.', 'advanced', 'guitar', 'book', 3),
  ('Beginner (Chords)', 'Build foundational chords, clean transitions, rhythm control and confident song accompaniment.', 'beginner', 'ukulele_standard', 'target', 0),
  ('Fingerstyle', 'Develop thumb-and-finger independence, picking patterns, coordination and musical expression on Standard Ukulele.', 'fingerstyle', 'ukulele_standard', 'guitar', 1),
  ('Intermediate (1. + 2.)', 'Combine the Beginner chord pathway and Fingerstyle pathway into fluent Standard Ukulele playing.', 'intermediate', 'ukulele_standard', 'music', 2),
  ('Advanced (Advance Chords)', 'Master advanced chord shapes, extensions and harmonic control on Standard Ukulele.', 'advanced', 'ukulele_standard', 'book', 3),
  ('Beginner (Strumming)', 'Master traditional Dotara-style strumming, rhythm patterns and song accompaniment.', 'beginner', 'ukulele_dotara', 'music', 0),
  ('Advanced (Tabs)', 'Develop advanced Dotara fingerpicking, tab reading and traditional technique.', 'advanced', 'ukulele_dotara', 'target', 1)
) as seed(title, description, category, instrument, icon_name, sort_order)
where not exists (
  select 1 from public.curriculum_items existing
  where existing.instrument = seed.instrument and existing.title = seed.title
);

insert into public.curriculum_items (title, description, category, instrument, icon_name, sort_order)
select seed.title, seed.description, seed.category, seed.instrument, seed.icon_name, seed.sort_order
from (values
  ('Standard Ukulele Foundations', 'Learn standard ukulele chords, rhythm, transitions and song accompaniment.', 'foundation', 'ukulele_standard', 'music', 0),
  ('Standard Ukulele Fingerstyle', 'Develop melody playing, picking patterns and expressive accompaniment.', 'technique', 'ukulele_standard', 'guitar', 1),
  ('Dotara Strumming', 'Master traditional Dotara-style strumming and rhythmic patterns.', 'foundation', 'ukulele_dotara', 'music', 0),
  ('Dotara Tabs', 'Develop fingerpicking, tab reading and advanced traditional techniques.', 'advanced', 'ukulele_dotara', 'target', 1)
) as seed(title, description, category, instrument, icon_name, sort_order)
where not exists (select 1 from public.curriculum_items where instrument = seed.instrument);

insert into public.schedule_items (title, description, day_label, time_label, sort_order)
select seed.title, seed.description, seed.day_label, seed.time_label, seed.sort_order
from (values
  ('Official class window', 'Core lessons and one-to-one sessions.', 'Friday', '8pm - 11pm', 0),
  ('Official class window', 'Group and personalized sessions.', 'Saturday', '10am - 1pm', 1),
  ('Official class window', 'Evening learning sessions.', 'Saturday', '7pm - 11pm', 2),
  ('Official class window', 'Weekend practice and lessons.', 'Sunday', '10am - 1pm', 3),
  ('Official class window', 'Evening learning sessions.', 'Sunday', '7pm - 11pm', 4)
) as seed(title, description, day_label, time_label, sort_order)
where not exists (select 1 from public.schedule_items);

insert into public.curriculum_items (title, description, category, icon_name, sort_order)
select seed.title, seed.description, seed.category, seed.icon_name, seed.sort_order
from (values
  ('Music Theory', 'Build a practical understanding of rhythm, intervals, keys, harmony, chords, scales and progressions.', 'foundation', 'book', 0),
  ('Chords', 'Learn chord construction, shapes, transitions, voicings and how chords function within a song.', 'core', 'music', 1),
  ('Scales', 'Understand scales beyond memorised patterns and connect them across the fretboard.', 'core', 'target', 2),
  ('Fingerstyle', 'Develop thumb-and-finger independence, coordination, patterns and musical expression.', 'technique', 'guitar', 3),
  ('Songwriting & Notation', 'Turn musical ideas into complete songs with chords, melodies, lyrics, structure and notation.', 'creative', 'pen', 4)
) as seed(title, description, category, icon_name, sort_order)
where not exists (select 1 from public.curriculum_items);

alter table public.schedule_items enable row level security;
alter table public.curriculum_items enable row level security;
alter table public.add_ons enable row level security;

create table if not exists public.student_plans (
  student_id uuid primary key references auth.users(id) on delete cascade,
  plan_id uuid references public.fee_plans(id),
  instrument text,
  format text,
  schedule_text text,
  status text not null default 'active',
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  coupon_code text,
  billing_period text not null,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments add column if not exists coupon_code text;

create table if not exists public.class_updates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  class_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.student_requests enable row level security;
alter table public.student_profiles enable row level security;
alter table public.site_content enable row level security;
alter table public.fee_plans enable row level security;
alter table public.discounts enable row level security;
alter table public.student_plans enable row level security;
alter table public.payments enable row level security;
alter table public.class_updates enable row level security;

drop policy if exists "profiles_self_or_admin_select" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
drop policy if exists "profiles_admin_insert" on public.profiles;
drop policy if exists "profiles_admin_delete" on public.profiles;
drop policy if exists "bookings_admin_select" on public.bookings;
drop policy if exists "bookings_admin_update" on public.bookings;
drop policy if exists "bookings_admin_delete" on public.bookings;
drop policy if exists "bookings_public_insert" on public.bookings;
drop policy if exists "student_requests_self_select" on public.student_requests;
drop policy if exists "student_requests_self_insert" on public.student_requests;
drop policy if exists "student_requests_admin_update" on public.student_requests;
drop policy if exists "student_requests_admin_delete" on public.student_requests;
drop policy if exists "student_profiles_admin_all" on public.student_profiles;
drop policy if exists "site_content_admin_all" on public.site_content;
drop policy if exists "site_content_public_read" on public.site_content;
drop policy if exists "fee_plans_public_read" on public.fee_plans;
drop policy if exists "fee_plans_admin_write" on public.fee_plans;
drop policy if exists "discounts_public_read" on public.discounts;
drop policy if exists "discounts_admin_write" on public.discounts;
drop policy if exists "student_plans_self_or_admin" on public.student_plans;
drop policy if exists "student_plans_admin_write" on public.student_plans;
drop policy if exists "payments_self_or_admin" on public.payments;
drop policy if exists "payments_admin_write" on public.payments;
drop policy if exists "class_updates_self_or_admin" on public.class_updates;
drop policy if exists "class_updates_admin_write" on public.class_updates;
drop policy if exists "schedule_items_public_read" on public.schedule_items;
drop policy if exists "schedule_items_admin_write" on public.schedule_items;
drop policy if exists "curriculum_items_public_read" on public.curriculum_items;
drop policy if exists "curriculum_items_admin_write" on public.curriculum_items;
drop policy if exists "add_ons_public_read" on public.add_ons;
drop policy if exists "add_ons_admin_write" on public.add_ons;

create policy "profiles_self_or_admin_select" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles_admin_update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profiles_admin_insert" on public.profiles for insert to authenticated with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles for delete to authenticated using (public.is_admin());
create policy "bookings_admin_select" on public.bookings for select to authenticated using (public.is_admin());
create policy "bookings_admin_update" on public.bookings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "bookings_admin_delete" on public.bookings for delete to authenticated using (public.is_admin());
create policy "bookings_public_insert" on public.bookings for insert to anon, authenticated with check (true);
create policy "student_requests_self_select" on public.student_requests for select to authenticated using (student_id = (select auth.uid()) or public.is_admin());
create policy "student_requests_self_insert" on public.student_requests for insert to authenticated with check (student_id = (select auth.uid()));
create policy "student_requests_admin_update" on public.student_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "student_requests_admin_delete" on public.student_requests for delete to authenticated using (public.is_admin());
create policy "student_profiles_admin_all" on public.student_profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "site_content_admin_all" on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "site_content_public_read" on public.site_content for select to anon, authenticated using (true);
create policy "fee_plans_public_read" on public.fee_plans for select to anon, authenticated using (active = true or public.is_admin());
create policy "fee_plans_admin_write" on public.fee_plans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "discounts_public_read" on public.discounts for select to anon, authenticated using (active = true or public.is_admin());
create policy "discounts_admin_write" on public.discounts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "student_plans_self_or_admin" on public.student_plans for select to authenticated using (student_id = (select auth.uid()) or public.is_admin());
create policy "student_plans_admin_write" on public.student_plans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "payments_self_or_admin" on public.payments for select to authenticated using (student_id = (select auth.uid()) or public.is_admin());
create policy "payments_admin_write" on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "class_updates_self_or_admin" on public.class_updates for select to authenticated using (student_id is null or student_id = (select auth.uid()) or public.is_admin());
create policy "class_updates_admin_write" on public.class_updates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "schedule_items_public_read" on public.schedule_items for select to anon, authenticated using (active = true or public.is_admin());
create policy "schedule_items_admin_write" on public.schedule_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "curriculum_items_public_read" on public.curriculum_items for select to anon, authenticated using (active = true or public.is_admin());
create policy "curriculum_items_admin_write" on public.curriculum_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "add_ons_public_read" on public.add_ons for select to anon, authenticated using (active = true or public.is_admin());
create policy "add_ons_admin_write" on public.add_ons for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists student_requests_student_id_idx on public.student_requests(student_id);
create index if not exists payments_student_id_idx on public.payments(student_id);
create index if not exists class_updates_student_id_idx on public.class_updates(student_id);

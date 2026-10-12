alter table public.student_profiles enable row level security;

drop policy if exists "student_profiles_self_read" on public.student_profiles;

create policy "student_profiles_self_read"
on public.student_profiles
for select
to authenticated
using (
  lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  and status = 'active'
);
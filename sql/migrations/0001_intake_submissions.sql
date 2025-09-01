-- sql/migrations/0001_intake_submissions.sql

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  source text not null check (source in ('reco','plan')),
  raw_text text not null,
  extracted_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.intake_submissions enable row level security;

-- Helper to read a header key from PostgREST (Supabase) request headers
-- If not available, returns null (policy becomes false and blocks).
create or replace function public.header_value(key text)
returns text language sql stable as $envExample
  select nullif(current_setting('request.headers', true)::jsonb ->> key, '');
$envExample;

-- Optional: if you mint a custom JWT with claim 'pf_session', you can read it here
create or replace function public.jwt_claim(claim text)
returns text language sql stable as $envExample
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> claim, '');
$envExample;

-- RLS: match session_id with either JWT claim 'pf_session' or header 'x-pf-session'
drop policy if exists "intake_submissions_r" on public.intake_submissions;
drop policy if exists "intake_submissions_w" on public.intake_submissions;

create policy "intake_submissions_r"
on public.intake_submissions
for select
using (
  session_id = coalesce(public.jwt_claim('pf_session'), public.header_value('x-pf-session'))
);

create policy "intake_submissions_w"
on public.intake_submissions
for all
using (
  session_id = coalesce(public.jwt_claim('pf_session'), public.header_value('x-pf-session'))
)
with check (
  session_id = coalesce(public.jwt_claim('pf_session'), public.header_value('x-pf-session'))
);
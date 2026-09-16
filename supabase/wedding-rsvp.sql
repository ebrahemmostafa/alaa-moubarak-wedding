-- Creates only a new wedding table; existing tables and data are untouched.
-- Intentionally fails if this table already exists, rather than modifying it.
begin;
create table public.wedding_rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  attendance text not null check (attendance in ('yes', 'no', 'pending')),
  guest_count integer not null default 1 check (guest_count > 0),
  phone text,
  email text,
  dietary_requirements text,
  message text,
  accommodation text,
  needs_transport boolean not null default false,
  song_request text,
  companions jsonb not null default '[]'::jsonb check (jsonb_typeof(companions) = 'array'),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);
create index wedding_rsvp_responses_responded_idx
  on public.wedding_rsvp_responses (responded_at desc, id desc);
alter table public.wedding_rsvp_responses enable row level security;
revoke all on public.wedding_rsvp_responses from anon, authenticated;
grant select, insert, update on public.wedding_rsvp_responses to anon, authenticated;
create policy wedding_rsvp_public_read on public.wedding_rsvp_responses
  for select to anon, authenticated using (responded_at is not null);
create policy wedding_rsvp_public_submit on public.wedding_rsvp_responses
  for insert to anon, authenticated with check (responded_at is not null);
create policy wedding_rsvp_public_update on public.wedding_rsvp_responses
  for update to anon, authenticated using (responded_at is not null)
  with check (responded_at is not null);
commit;

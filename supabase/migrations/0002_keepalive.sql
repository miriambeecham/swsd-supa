-- =============================================================================
-- Keep-alive table for the Supabase Keep-Alive workflow.
-- =============================================================================
-- Free-tier Supabase projects pause after 7 days without "activity". REST
-- reads (which the original keep-alive used) don't reliably reset that
-- inactivity clock. Writes do. The workflow upserts the singleton row
-- below on a 2-3 day cadence so the clock can never reach 7 days.
-- =============================================================================

create table public.keepalive (
  id int primary key default 1 check (id = 1),
  updated_at timestamptz not null default now()
);

alter table public.keepalive enable row level security;

insert into public.keepalive (id) values (1);

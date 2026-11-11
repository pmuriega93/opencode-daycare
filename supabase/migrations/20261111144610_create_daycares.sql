create table public.daycares (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  timezone   text        not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daycares_name_not_blank check (length(btrim(name)) > 0)
);

comment on table public.daycares is
  'Daycare center. Tenant root for users, rooms and children.';
comment on column public.daycares.timezone is
  'IANA timezone used for daily summaries and scheduled notifications.';

create trigger daycares_set_updated_at
before update on public.daycares
for each row
execute function public.set_updated_at();

alter table public.daycares enable row level security;

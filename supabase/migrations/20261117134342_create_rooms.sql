create table public.rooms (
  id         uuid        primary key default gen_random_uuid(),
  daycare_id uuid        not null references public.daycares (id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_name_not_blank check (length(btrim(name)) > 0),
  constraint rooms_daycare_id_name_key unique (daycare_id, name)
);

comment on table public.rooms is
  'Daycare rooms (salas). Every child belongs to exactly one room.';
comment on column public.rooms.name is
  'Display name, e.g. "Soles". Unique per daycare.';

create index rooms_daycare_id_idx on public.rooms (daycare_id);

create trigger rooms_set_updated_at
before update on public.rooms
for each row
execute function public.set_updated_at();

alter table public.rooms enable row level security;

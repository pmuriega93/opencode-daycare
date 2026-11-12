create table public.users (
  id                    uuid               primary key
                          references auth.users (id) on delete cascade,
  daycare_id            uuid               references public.daycares (id),
  role                  public.user_role   not null default 'parent',
  status                public.user_status not null default 'pending',
  full_name             text               not null,
  avatar_url            text,
  notify_on_post        boolean            not null default true,
  daily_summary_enabled boolean            not null default true,
  created_at            timestamptz        not null default now(),
  updated_at            timestamptz        not null default now(),
  constraint users_full_name_not_blank check (length(btrim(full_name)) > 0),
  constraint users_active_requires_daycare check (status <> 'active' or daycare_id is not null)
);

comment on table public.users is
  'Application profile linked 1:1 to auth.users. Credentials and email live in auth.users.';
comment on column public.users.daycare_id is
  'Daycare the user belongs to. NULL until an invitation links the user (status = pending).';
comment on column public.users.role is
  'Application role. Written from app_metadata at signup; only service_role can change it.';
comment on column public.users.status is
  'pending = signed up but not linked to a daycare; active = linked and operational.';

create index users_daycare_id_idx on public.users (daycare_id);

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;

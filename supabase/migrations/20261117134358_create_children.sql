create table public.children (
  id            uuid                primary key default gen_random_uuid(),
  room_id       uuid                not null references public.rooms (id),
  full_name     text                not null,
  birth_date    date                not null,
  enrolled_at   date                not null default current_date,
  medical_notes text,
  allergy_tags  text[]              not null default '{}',
  photo_consent boolean             not null default true,
  status        public.child_status not null default 'active',
  created_at    timestamptz         not null default now(),
  updated_at    timestamptz         not null default now(),
  constraint children_full_name_not_blank check (length(btrim(full_name)) > 0)
);

comment on table public.children is
  'Enrolled children. A child always belongs to a room; the daycare comes from the room.';
comment on column public.children.enrolled_at is
  'Enrollment date. Defaults to the insert day.';
comment on column public.children.allergy_tags is
  'Allergy tags in English (peanut, lactose, …). The UI translates them to Spanish.';
comment on column public.children.medical_notes is
  'Free-text medical notes and instructions.';
comment on column public.children.status is
  'active = visible in the app; archived = soft-deleted, hidden from the list.';

create index children_room_id_idx on public.children (room_id);

create trigger children_set_updated_at
before update on public.children
for each row
execute function public.set_updated_at();

alter table public.children enable row level security;

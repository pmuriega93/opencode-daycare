create policy rooms_select_own_daycare on public.rooms
for select to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = rooms.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy rooms_insert_own_daycare on public.rooms
for insert to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = rooms.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy rooms_update_own_daycare on public.rooms
for update to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = rooms.daycare_id
      and u.role in ('staff', 'admin')
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = rooms.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy children_select_own_daycare on public.children
for select to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.users u on u.id = (select auth.uid())
    where r.id = children.room_id
      and r.daycare_id = u.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy children_insert_own_daycare on public.children
for insert to authenticated
with check (
  exists (
    select 1
    from public.rooms r
    join public.users u on u.id = (select auth.uid())
    where r.id = children.room_id
      and r.daycare_id = u.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy children_update_own_daycare on public.children
for update to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.users u on u.id = (select auth.uid())
    where r.id = children.room_id
      and r.daycare_id = u.daycare_id
      and u.role in ('staff', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.users u on u.id = (select auth.uid())
    where r.id = children.room_id
      and r.daycare_id = u.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy users_select_own on public.users
for select to authenticated
using ((select auth.uid()) = id);

create policy users_update_own on public.users
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy daycares_select_own on public.daycares
for select to authenticated
using (
  id = (select u.daycare_id from public.users u where u.id = (select auth.uid()))
);

create or replace function public.guard_user_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.id then
    new.role       := old.role;
    new.status     := old.status;
    new.daycare_id := old.daycare_id;
  end if;
  return new;
end;
$$;

comment on function public.guard_user_privileged_columns() is
  'Reverts role, status and daycare_id when a signed-in user updates their own profile. service_role (auth.uid() is NULL) is unaffected.';

revoke all on function public.guard_user_privileged_columns() from public, anon, authenticated;

create trigger users_guard_privileged_columns
before update on public.users
for each row
execute function public.guard_user_privileged_columns();

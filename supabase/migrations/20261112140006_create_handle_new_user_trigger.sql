create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  app_meta     jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  user_meta    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_daycare_id uuid  := nullif(app_meta ->> 'daycare_id', '')::uuid;
  v_role       public.user_role := coalesce(nullif(app_meta ->> 'role', ''), 'parent')::public.user_role;
  v_full_name  text  := coalesce(
    nullif(btrim(app_meta ->> 'full_name'), ''),
    nullif(btrim(user_meta ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Usuario'
  );
begin
  if v_role in ('staff', 'admin') and v_daycare_id is null then
    raise exception 'app_metadata.daycare_id is required for role %', v_role;
  end if;

  insert into public.users (id, daycare_id, role, status, full_name)
  values (
    new.id,
    v_daycare_id,
    v_role,
    (case when v_daycare_id is null then 'pending' else 'active' end)::public.user_status,
    v_full_name
  );

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates public.users after an auth.users insert. role and daycare_id come from app_metadata; full_name from app_metadata or user metadata.';

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

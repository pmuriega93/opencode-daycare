-- Reusable function: every table with updated_at attaches it with a trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Sets NEW.updated_at to now() on UPDATE. Attach with BEFORE UPDATE ... FOR EACH ROW.';

create type public.child_status as enum ('active', 'archived');

comment on type public.child_status is
  'Child lifecycle. `active` is enrolled and visible; `archived` is a soft delete.';

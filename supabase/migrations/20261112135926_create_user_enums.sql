create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

comment on type public.user_role is
  'Application role. `staff` and `admin` are daycare team members; `parent` is a family member.';
comment on type public.user_status is
  'Profile lifecycle. `pending` until the user is linked to a daycare; `active` once linked.';

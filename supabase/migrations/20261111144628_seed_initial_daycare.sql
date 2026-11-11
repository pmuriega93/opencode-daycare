insert into public.daycares (id, name, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'Guardería Sala Soles',
  'America/Argentina/Buenos_Aires'
)
on conflict (id) do nothing;

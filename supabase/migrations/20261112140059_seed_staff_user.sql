do $$
declare
  v_user_id uuid := '22222222-2222-4222-8222-222222222222';
  v_email   text := 'caro@opendaycare.com';
begin
  if exists (select 1 from auth.users where email = v_email) then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt('opendaycare123', extensions.gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'role', 'staff',
      'daycare_id', '11111111-1111-4111-8111-111111111111',
      'full_name', 'Caro Giménez'
    ),
    jsonb_build_object('full_name', 'Caro Giménez'),
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    'email',
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    now(), now(), now()
  );
end
$$;

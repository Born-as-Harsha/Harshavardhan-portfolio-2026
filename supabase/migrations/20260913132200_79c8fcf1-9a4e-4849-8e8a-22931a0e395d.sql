create or replace function public.admin_bootstrap_available()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.user_roles where role = 'admin')
$$;

revoke all on function public.admin_bootstrap_available() from public, anon;
grant execute on function public.admin_bootstrap_available() to authenticated;

create or replace function public.claim_admin_bootstrap()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _email text;
  _existing int;
begin
  if _uid is null then
    raise exception 'unauthorized' using errcode = 'insufficient_privilege';
  end if;

  -- Serialize concurrent claims so exactly one caller can win the race.
  perform pg_advisory_xact_lock(hashtext('admin_bootstrap'));

  select count(*) into _existing from public.user_roles where role = 'admin';
  select u.email into _email from auth.users u where u.id = _uid;

  if _existing > 0 then
    perform public.append_audit_event(
      'admin.bootstrap', 'user_role', 'deny', _uid, _email, null, _uid::text,
      jsonb_build_object('reason', 'already_bootstrapped'));
    return jsonb_build_object('granted', false, 'reason', 'already_bootstrapped');
  end if;

  insert into public.user_roles (user_id, role) values (_uid, 'admin')
  on conflict (user_id, role) do nothing;

  perform public.append_audit_event(
    'admin.bootstrap', 'user_role', 'allow', _uid, _email, null, _uid::text,
    jsonb_build_object('method', 'first_user_bootstrap'));

  return jsonb_build_object('granted', true);
end $$;

revoke all on function public.claim_admin_bootstrap() from public, anon;
grant execute on function public.claim_admin_bootstrap() to authenticated;
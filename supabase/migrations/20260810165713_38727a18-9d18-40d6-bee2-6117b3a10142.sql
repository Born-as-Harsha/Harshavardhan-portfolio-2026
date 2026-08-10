create or replace function public.audit_canonical(
  _occurred_at timestamptz, _actor_id uuid, _action text, _resource_type text,
  _resource_id text, _outcome text, _context jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select jsonb_build_object(
    'action', _action,
    'actor_id', coalesce(_actor_id::text, ''),
    'context', _context,
    'occurred_at', to_char(_occurred_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'outcome', _outcome,
    'resource_id', coalesce(_resource_id, ''),
    'resource_type', _resource_type
  )::text
$$;

revoke execute on function public.audit_canonical(timestamptz,uuid,text,text,text,text,jsonb) from public, anon;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.verify_audit_chain(bigint,integer) from public, anon;
revoke execute on function public.audit_events_immutable() from public, anon, authenticated;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- roles
do $$ begin
  create type public.app_role as enum ('admin','moderator','user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create policy "admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------- audit log
create table public.audit_events (
  id            bigserial primary key,
  occurred_at   timestamptz not null default now(),
  actor_id      uuid,
  actor_email   text,
  actor_ip_hash text,
  action        text not null,
  resource_type text not null,
  resource_id   text,
  outcome       text not null check (outcome in ('allow','deny','error')),
  context       jsonb not null default '{}'::jsonb,
  prev_hash     char(64) not null,
  row_hash      char(64) not null
);

create index audit_events_occurred_at_idx on public.audit_events (occurred_at desc, id desc);
create index audit_events_action_idx on public.audit_events (action, occurred_at desc);
create index audit_events_resource_idx on public.audit_events (resource_type, resource_id);
create index audit_events_context_idx on public.audit_events using gin (context jsonb_path_ops);

grant select on public.audit_events to authenticated;
grant all on public.audit_events to service_role;
alter table public.audit_events enable row level security;

create policy "admins read audit" on public.audit_events
  for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.audit_chain_head (
  id integer primary key default 1 check (id = 1),
  head_hash char(64) not null default repeat('0',64),
  event_count bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.audit_chain_head (id) values (1) on conflict do nothing;

grant select on public.audit_chain_head to authenticated;
grant all on public.audit_chain_head to service_role;
alter table public.audit_chain_head enable row level security;
create policy "admins read chain head" on public.audit_chain_head
  for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- immutability: no row may ever be updated or deleted, even by service_role
create or replace function public.audit_events_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'audit_events is append-only (attempted %)', tg_op
    using errcode = 'insufficient_privilege';
end $$;

create trigger audit_events_no_update
  before update or delete on public.audit_events
  for each row execute function public.audit_events_immutable();

-- canonical serialization: sorted-key, compact JSON of the signed fields
create or replace function public.audit_canonical(
  _occurred_at timestamptz, _actor_id uuid, _action text, _resource_type text,
  _resource_id text, _outcome text, _context jsonb)
returns text
language sql
immutable
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

-- single writer: locks the chain head so concurrent appends cannot fork the chain
create or replace function public.append_audit_event(
  _action text,
  _resource_type text,
  _outcome text,
  _actor_id uuid default null,
  _actor_email text default null,
  _actor_ip_hash text default null,
  _resource_id text default null,
  _context jsonb default '{}'::jsonb
) returns public.audit_events
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _prev char(64);
  _at timestamptz := now();
  _hash char(64);
  _row public.audit_events;
begin
  select head_hash into _prev from public.audit_chain_head where id = 1 for update;
  if _prev is null then
    insert into public.audit_chain_head (id) values (1) returning head_hash into _prev;
  end if;

  _hash := encode(extensions.digest(
    _prev || public.audit_canonical(_at,_actor_id,_action,_resource_type,_resource_id,_outcome,_context),
    'sha256'), 'hex');

  insert into public.audit_events
    (occurred_at, actor_id, actor_email, actor_ip_hash, action, resource_type,
     resource_id, outcome, context, prev_hash, row_hash)
  values (_at, _actor_id, _actor_email, _actor_ip_hash, _action, _resource_type,
          _resource_id, _outcome, coalesce(_context,'{}'::jsonb), _prev, _hash)
  returning * into _row;

  update public.audit_chain_head
     set head_hash = _hash, event_count = event_count + 1, updated_at = now()
   where id = 1;

  return _row;
end $$;

revoke all on function public.append_audit_event(text,text,text,uuid,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.append_audit_event(text,text,text,uuid,text,text,text,jsonb) to service_role;

-- chain verification, admin-callable
create or replace function public.verify_audit_chain(_from_id bigint default 0, _limit integer default 10000)
returns table (checked bigint, first_bad_id bigint, ok boolean)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  r record;
  _prev char(64);
  _n bigint := 0;
  _bad bigint := null;
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'forbidden' using errcode = 'insufficient_privilege';
  end if;

  for r in
    select * from public.audit_events where id >= _from_id order by id asc limit greatest(_limit,1)
  loop
    if _prev is not null and r.prev_hash <> _prev then
      _bad := r.id; exit;
    end if;
    if r.row_hash <> encode(extensions.digest(
         r.prev_hash || public.audit_canonical(r.occurred_at, r.actor_id, r.action,
           r.resource_type, r.resource_id, r.outcome, r.context), 'sha256'), 'hex') then
      _bad := r.id; exit;
    end if;
    _prev := r.row_hash;
    _n := _n + 1;
  end loop;

  return query select _n, _bad, _bad is null;
end $$;

grant execute on function public.verify_audit_chain(bigint,integer) to authenticated, service_role;

-- ---------------------------------------------------------------- certificates
create table public.certificate_artifacts (
  asset_id uuid primary key,
  sha256 char(64) not null,
  bytes bigint not null check (bytes > 0),
  filename text not null,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  unique (sha256, asset_id)
);

create index certificate_artifacts_sha256_idx on public.certificate_artifacts (sha256);

grant select on public.certificate_artifacts to anon, authenticated;
grant all on public.certificate_artifacts to service_role;
alter table public.certificate_artifacts enable row level security;

create policy "public artifacts readable" on public.certificate_artifacts
  for select to anon, authenticated using (visibility = 'public');
create policy "admins read all artifacts" on public.certificate_artifacts
  for select to authenticated using (public.has_role(auth.uid(),'admin'));

insert into public.certificate_artifacts (asset_id, sha256, bytes, filename) values
 ('2bb90da8-56a4-4947-9cd0-9d6e7fbbce2d','a76450de770ed409501aa261455099fdf405c2f4db5c9459b313bdb475814e98',399441,'ssit-fpga-vlsi.pdf'),
 ('66796774-f19d-4539-af6b-3bde41d2b0cc','2e1626cb1dc6db38581b7c1074d484c575f9e2a112abfd835d9d0a23af9777a8',635200,'ijirt-reviewer.pdf'),
 ('d3bd3e44-b6ea-467f-b8f5-d9f20911ac7e','b7198d7bdcf151d2822938447517b3b57c234a4a96b3211623c73129f3e9e9a6',337600,'eduskills-siemens.pdf'),
 ('68973724-5969-4859-afb7-4832fef2298d','e210188c2e30a98afb76c765d2e80a76a49d456fe8dc8d1f55d0530991bf10f4',330330,'coursera-python-for-everybody.pdf'),
 ('ecbb7e98-09ce-4b51-8f1c-a17cefb5f973','55a85e59832d6a7943d59e8abd7447c4bda119bf297c04e306bf192da2129106',316524,'taras-ai-ml.pdf'),
 ('a7a8ecf6-3958-4f6a-b2ba-8daa1f917146','9fb78bcefba2e5ab7805b7838697cc34c38b330fdecb3eb30bcc3627fcd1a0f4',538391,'linux-foundation.pdf'),
 ('30746126-7f90-4e19-8c79-7191c376b0c9','8602238dba313d144a0c3560a89ccab77e92d1119dccbc169f2a5a457b52c0ea',189607,'cisco-packet-tracer.pdf'),
 ('338382f7-31c8-4d49-8625-a7d7897f7d59','b66b74ff7ae8e0e7f15465b4f2f62f21f4fce2514719e5ef84217d83cbcb81a8',1066179,'amdox-web-dev-internship.pdf')
on conflict (asset_id) do nothing;
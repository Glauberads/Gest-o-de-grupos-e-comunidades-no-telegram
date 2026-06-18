create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  actor_type text not null,
  actor_id text,
  actor_email text,
  category text not null,
  action text not null,
  entity_type text,
  entity_id text,
  status text not null default 'success',
  severity text not null default 'info',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  request_id text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs (created_at desc);

create index if not exists idx_audit_logs_category_created_at
  on public.audit_logs (category, created_at desc);

create index if not exists idx_audit_logs_organization_created_at
  on public.audit_logs (organization_id, created_at desc);

create index if not exists idx_audit_logs_action_created_at
  on public.audit_logs (action, created_at desc);

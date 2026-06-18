alter table if exists organization_subscriptions
  add column if not exists active_until timestamptz,
  add column if not exists lifetime boolean not null default false,
  add column if not exists activation_source text not null default 'asaas',
  add column if not exists notes text;

alter table if exists organization_payments
  add column if not exists activation_source text not null default 'asaas',
  add column if not exists notes text;

create table if not exists subscription_audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  admin_user_id uuid not null,
  action text not null,
  old_status text,
  new_status text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscription_audit_logs_organization
  on subscription_audit_logs (organization_id, created_at desc);

update organization_subscriptions
set active_until = coalesce(active_until, current_period_end)
where active_until is null;

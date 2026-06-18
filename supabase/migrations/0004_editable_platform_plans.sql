alter table public.platform_plans
  add column if not exists slug text,
  add column if not exists max_communities integer not null default 1,
  add column if not exists max_telegram_groups integer not null default 1,
  add column if not exists max_automations integer not null default 0,
  add column if not exists has_priority_support boolean not null default false,
  add column if not exists has_advanced_reports boolean not null default false,
  add column if not exists has_ai_moderation boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists archived_at timestamptz;

update public.platform_plans
set slug = lower(regexp_replace(code, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

alter table public.platform_plans
  alter column slug set not null;

create unique index if not exists idx_platform_plans_slug
  on public.platform_plans (slug);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_admin_audit_logs_entity_created_at
  on public.admin_audit_logs (entity_type, entity_id, created_at desc);

update public.platform_plans
set
  max_communities = case lower(code)
    when 'starter' then 1
    when 'pro' then 3
    when 'scale' then 10
    else max_communities
  end,
  max_telegram_groups = case lower(code)
    when 'starter' then 1
    when 'pro' then 3
    when 'scale' then 10
    else max_telegram_groups
  end,
  max_automations = case lower(code)
    when 'starter' then 5
    when 'pro' then 20
    when 'scale' then 100
    else max_automations
  end,
  has_priority_support = case when lower(code) = 'scale' then true else has_priority_support end,
  has_advanced_reports = case when lower(code) in ('pro', 'scale') then true else has_advanced_reports end,
  has_ai_moderation = case when lower(code) = 'scale' then true else has_ai_moderation end,
  is_featured = case when lower(code) = 'pro' then true else is_featured end,
  sort_order = case lower(code)
    when 'starter' then 1
    when 'pro' then 2
    when 'scale' then 3
    else sort_order
  end
where code in ('starter', 'pro', 'scale');

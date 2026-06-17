alter table organizations
  alter column status set default 'pending_payment';

create table if not exists platform_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  price_cents integer not null,
  billing_interval text not null default 'monthly',
  trial_days integer not null default 0,
  features jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  platform_plan_id uuid not null references platform_plans(id),
  status text not null default 'pending_payment',
  asaas_subscription_id text,
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_period_ends_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists organization_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  organization_subscription_id uuid not null references organization_subscriptions(id) on delete cascade,
  platform_plan_id uuid not null references platform_plans(id),
  asaas_payment_id text unique,
  asaas_customer_id text,
  status text not null default 'pending',
  billing_type text not null default 'PIX',
  amount_cents integer not null,
  due_date date,
  paid_at timestamptz,
  pix_payload text,
  pix_qr_code_image text,
  invoice_url text,
  external_reference text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists telegram_bots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text,
  username text,
  encrypted_token text not null,
  is_active boolean not null default true,
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists telegram_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  community_id uuid references communities(id) on delete cascade,
  telegram_bot_id uuid references telegram_bots(id) on delete set null,
  telegram_chat_id text not null,
  title text,
  chat_type text not null default 'group',
  auto_approve_enabled boolean not null default false,
  welcome_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, telegram_chat_id)
);

create index if not exists idx_organization_subscriptions_organization on organization_subscriptions (organization_id);
create index if not exists idx_organization_payments_organization_status on organization_payments (organization_id, status);
create index if not exists idx_telegram_bots_organization on telegram_bots (organization_id);
create index if not exists idx_telegram_groups_organization on telegram_groups (organization_id);

insert into platform_plans (name, code, description, price_cents, billing_interval, trial_days, features, status)
values
  ('Starter', 'starter', 'Plano de entrada para gerir uma comunidade com automacoes essenciais.', 9900, 'monthly', 0, '["1 comunidade","Bot Telegram","Automacoes basicas"]'::jsonb, 'active'),
  ('Pro', 'pro', 'Plano para operacoes com mais recursos de automacao e moderacao.', 19900, 'monthly', 0, '["3 comunidades","Bot Telegram","Automacoes avancadas","Relatorios"]'::jsonb, 'active'),
  ('Scale', 'scale', 'Plano para operacoes com multiplas comunidades e equipe.', 39900, 'monthly', 0, '["10 comunidades","Equipe","Relatorios","Prioridade"]'::jsonb, 'active')
on conflict (code) do nothing;

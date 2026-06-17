create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null references users(id),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  public_slug text not null unique,
  public_url text,
  status text not null default 'active',
  auto_approve_enabled boolean not null default true,
  welcome_message text,
  expiry_warning_days integer not null default 3,
  remove_after_overdue_days integer not null default 7,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists telegram_chats (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  telegram_chat_id text not null,
  chat_type text not null default 'group',
  title text,
  bot_is_admin boolean not null default false,
  can_invite_users boolean not null default false,
  can_restrict_members boolean not null default false,
  webhook_secret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, telegram_chat_id)
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  name text not null,
  description text,
  billing_interval text not null,
  price_cents integer not null,
  duration_days integer,
  is_recurring boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  plan_id uuid references plans(id),
  full_name text not null,
  email text not null,
  whatsapp text,
  document text not null,
  telegram_user_id text,
  telegram_username text,
  status text not null default 'pending',
  joined_at timestamptz,
  access_expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists asaas_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  asaas_customer_id text not null unique,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  plan_id uuid not null references plans(id),
  asaas_subscription_id text not null unique,
  status text not null default 'active',
  next_due_date date,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  plan_id uuid references plans(id),
  subscription_id uuid references subscriptions(id),
  asaas_payment_id text not null unique,
  billing_type text not null default 'PIX',
  status text not null,
  amount_cents integer not null,
  due_date date,
  paid_at timestamptz,
  external_reference text,
  pix_payload text,
  pix_qr_code_image text,
  invoice_url text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invite_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  telegram_chat_id text not null,
  invite_link text not null,
  telegram_invite_link_id text,
  status text not null default 'created',
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  status text not null default 'received',
  error_message text,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table if not exists bot_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  community_id uuid references communities(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  action text not null,
  status text not null default 'success',
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  automation_type text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, automation_type)
);

create index if not exists idx_communities_organization on communities (organization_id);
create index if not exists idx_plans_community on plans (community_id);
create index if not exists idx_members_community_status on members (community_id, status);
create index if not exists idx_payments_member_status on payments (member_id, status);
create index if not exists idx_webhook_events_provider_status on webhook_events (provider, status);

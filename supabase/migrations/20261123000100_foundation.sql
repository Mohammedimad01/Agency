-- =============================================================================
-- FOUNDATION: extensions, enums, utilities, organizations, identity & RBAC
-- =============================================================================
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.member_status      as enum ('invited','active','deactivated');
create type public.priority_level     as enum ('low','medium','high','urgent');
create type public.client_type        as enum ('individual','company');
create type public.client_status      as enum ('active','inactive','archived');
create type public.lead_status        as enum ('new','contacted','discovery','qualified','proposal_sent','negotiation','won','lost','not_qualified');
create type public.project_status     as enum ('draft','planning','in_progress','on_hold','awaiting_client','in_review','completed','cancelled');
create type public.milestone_status   as enum ('pending','in_progress','completed');
create type public.task_status        as enum ('todo','in_progress','in_review','blocked','done');
create type public.proposal_status    as enum ('draft','sent','viewed','accepted','rejected','expired');
create type public.contract_status    as enum ('draft','sent','signed','active','expired','terminated');
create type public.invoice_status     as enum ('draft','sent','partially_paid','paid','overdue','cancelled');
create type public.payment_status     as enum ('pending','completed','failed','refunded');
create type public.payment_method     as enum ('bank_transfer','card','cash','cheque','upi','paypal','stripe','other');
create type public.discount_type      as enum ('none','percent','fixed');
create type public.deliverable_status as enum ('draft','submitted','approved','changes_requested');
create type public.review_decision    as enum ('approved','changes_requested');
create type public.revision_status    as enum ('open','in_progress','resolved');
create type public.file_visibility    as enum ('internal','client');
create type public.email_status       as enum ('pending','sending','sent','failed','cancelled');
create type public.meeting_status     as enum ('requested','scheduled','completed','cancelled');

-- ---------------------------------------------------------------------------
-- Utilities
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Organizations (tenant boundary)
-- ---------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       extensions.citext not null,
  full_name   text,
  avatar_url  text,
  phone       text,
  job_title   text,
  timezone    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (email);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function private.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- RBAC: roles, permissions, role_permissions
-- ---------------------------------------------------------------------------
create table public.roles (
  key          text primary key,
  name         text not null,
  description  text,
  is_team_role boolean not null default true,
  rank         int not null default 100       -- lower = more privileged
);

create table public.permissions (
  key          text primary key,
  module       text not null,
  description  text not null
);

create table public.role_permissions (
  role_key        text not null references public.roles(key) on delete cascade,
  permission_key  text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

insert into public.roles (key, name, description, is_team_role, rank) values
  ('owner','Owner','Full control of the agency, including billing, team and settings.', true, 0),
  ('admin','Administrator','Manages operations, team, clients and finances.', true, 10),
  ('project_manager','Project Manager','Runs projects, clients and delivery.', true, 20),
  ('finance_manager','Finance Manager','Manages proposals, invoices, payments and expenses.', true, 30),
  ('analyst','Analyst','Read access to CRM, projects and reports.', true, 40),
  ('developer','Developer','Works on assigned projects and tasks.', true, 50),
  ('designer','Designer','Works on assigned projects and tasks.', true, 50),
  ('client','Client','External client with portal access to their own organization only.', false, 100);

insert into public.permissions (key, module, description) values
  ('dashboard.view','dashboard','View the agency dashboard'),
  ('leads.view','leads','View leads and pipeline'),
  ('leads.manage','leads','Create, edit, assign and convert leads'),
  ('clients.view','clients','View the client database'),
  ('clients.manage','clients','Create and edit clients, contacts and portal access'),
  ('projects.view_all','projects','View every project (not only assigned ones)'),
  ('projects.manage','projects','Create and manage any project'),
  ('templates.manage','projects','Manage project templates'),
  ('services.manage','services','Manage the service catalogue'),
  ('content.manage','website','Manage website content (portfolio, testimonials, FAQs)'),
  ('proposals.view','sales','View proposals'),
  ('proposals.manage','sales','Create, send and edit proposals'),
  ('contracts.view','sales','View contracts'),
  ('contracts.manage','sales','Manage contracts'),
  ('finance.view','finance','View invoices, payments, expenses and financial metrics'),
  ('finance.manage','finance','Create invoices, record payments and expenses'),
  ('reports.view','reports','View operational reports'),
  ('reports.finance','reports','View financial reports'),
  ('team.view','team','View team members'),
  ('team.manage','team','Invite, edit and deactivate team members'),
  ('settings.manage','settings','Manage agency settings');

-- Owner implicitly has every permission (see has_permission). Admin gets everything explicitly.
insert into public.role_permissions (role_key, permission_key)
select 'admin', key from public.permissions;

insert into public.role_permissions (role_key, permission_key)
select 'project_manager', unnest(array[
  'dashboard.view','leads.view','leads.manage','clients.view','clients.manage','projects.view_all',
  'projects.manage','templates.manage','services.manage','proposals.view','contracts.view',
  'reports.view','team.view']);

insert into public.role_permissions (role_key, permission_key)
select 'finance_manager', unnest(array[
  'dashboard.view','clients.view','projects.view_all','proposals.view','proposals.manage',
  'contracts.view','contracts.manage','finance.view','finance.manage','reports.view',
  'reports.finance','team.view']);

insert into public.role_permissions (role_key, permission_key)
select 'analyst', unnest(array[
  'dashboard.view','leads.view','clients.view','projects.view_all','reports.view','team.view']);

insert into public.role_permissions (role_key, permission_key)
select r, p from unnest(array['developer','designer']) r, unnest(array['dashboard.view','team.view']) p;

-- ---------------------------------------------------------------------------
-- Team members (agency staff)
-- ---------------------------------------------------------------------------
create table public.team_members (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  profile_id              uuid not null references public.profiles(id) on delete cascade,
  role_key                text not null references public.roles(key) check (role_key <> 'client'),
  status                  public.member_status not null default 'invited',
  title                   text,
  capacity_hours_per_week int not null default 40 check (capacity_hours_per_week between 0 and 168),
  hourly_cost_cents       bigint check (hourly_cost_cents >= 0),
  invited_by              uuid references public.profiles(id) on delete set null,
  invited_at              timestamptz,
  joined_at               timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (organization_id, profile_id)
);
create index team_members_profile_idx on public.team_members (profile_id);
create trigger trg_team_members_updated before update on public.team_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Organization settings (operational configuration, editable in admin)
-- ---------------------------------------------------------------------------
create table public.settings (
  organization_id            uuid primary key references public.organizations(id) on delete cascade,
  currency                   char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  timezone                   text not null default 'UTC',
  default_tax_rate_bps       int not null default 0 check (default_tax_rate_bps between 0 and 10000),
  default_payment_terms_days int not null default 14 check (default_payment_terms_days between 0 and 365),
  invoice_prefix             text not null default 'INV-',
  next_invoice_number        int not null default 1 check (next_invoice_number > 0),
  proposal_prefix            text not null default 'PRO-',
  next_proposal_number       int not null default 1 check (next_proposal_number > 0),
  project_prefix             text not null default 'PRJ-',
  next_project_number        int not null default 1 check (next_project_number > 0),
  payment_instructions       text,
  company_legal_name         text,
  company_address            text,
  company_email              text,
  company_phone              text,
  tax_id                     text,
  invoice_footer             text,
  lead_capacity_projects     int not null default 6 check (lead_capacity_projects > 0),
  updated_at                 timestamptz not null default now()
);
create trigger trg_settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER, used by RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.team_members
    where organization_id = p_org and profile_id = (select auth.uid()) and status = 'active'
  );
$$;

create or replace function public.has_permission(p_org uuid, p_perm text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.team_members tm
    left join public.role_permissions rp
      on rp.role_key = tm.role_key and rp.permission_key = p_perm
    where tm.organization_id = p_org
      and tm.profile_id = (select auth.uid())
      and tm.status = 'active'
      and (tm.role_key = 'owner' or rp.permission_key is not null)
  );
$$;

create or replace function public.team_role(p_org uuid)
returns text language sql stable security definer set search_path = '' as $$
  select role_key from public.team_members
  where organization_id = p_org and profile_id = (select auth.uid()) and status = 'active';
$$;

create or replace function public.user_org_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select organization_id from public.team_members
  where profile_id = (select auth.uid()) and status = 'active';
$$;

grant execute on function public.is_org_member(uuid), public.has_permission(uuid, text),
  public.team_role(uuid), public.user_org_ids() to authenticated;
revoke execute on function public.is_org_member(uuid), public.has_permission(uuid, text),
  public.team_role(uuid), public.user_org_ids() from anon, public;

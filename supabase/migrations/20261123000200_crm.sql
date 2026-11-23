-- =============================================================================
-- CRM: services, clients, contacts, leads, lead activity, meetings
-- =============================================================================

create table public.services (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  slug                  text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                  text not null check (char_length(name) between 1 and 120),
  category              text not null default 'General',
  summary               text,
  description           text,
  icon                  text,
  starting_price_cents  bigint check (starting_price_cents >= 0),
  delivery_time         text,
  deliverables          text[] not null default '{}',
  features              text[] not null default '{}',
  is_active             boolean not null default true,
  is_public             boolean not null default true,
  sort_order            int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (organization_id, slug)
);
create index services_org_idx on public.services (organization_id, sort_order);
create trigger trg_services_updated before update on public.services
  for each row execute function public.set_updated_at();

create table public.clients (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  type                    public.client_type not null default 'company',
  name                    text not null check (char_length(name) between 1 and 200),
  company_name            text,
  email                   extensions.citext,
  phone                   text,
  website                 text,
  industry                text,
  address_line1           text,
  address_line2           text,
  city                    text,
  state                   text,
  postal_code             text,
  country                 text,
  tax_id                  text,
  status                  public.client_status not null default 'active',
  source                  text,
  account_manager_id      uuid references public.profiles(id) on delete set null,
  notes                   text,
  converted_from_lead_id  uuid,
  created_by              uuid references public.profiles(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);
create index clients_org_idx on public.clients (organization_id, status) where deleted_at is null;
create index clients_manager_idx on public.clients (account_manager_id);
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

create table public.client_contacts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  client_id        uuid not null references public.clients(id) on delete cascade,
  profile_id       uuid references public.profiles(id) on delete set null,
  full_name        text not null,
  email            extensions.citext not null,
  phone            text,
  job_title        text,
  is_primary       boolean not null default false,
  portal_access    boolean not null default false,
  invited_at       timestamptz,
  last_seen_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (client_id, email)
);
create unique index client_contacts_profile_uniq on public.client_contacts (client_id, profile_id) where profile_id is not null;
create index client_contacts_profile_idx on public.client_contacts (profile_id) where profile_id is not null;
create trigger trg_client_contacts_updated before update on public.client_contacts
  for each row execute function public.set_updated_at();

create table public.leads (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  full_name             text not null check (char_length(full_name) between 1 and 200),
  company               text,
  email                 extensions.citext not null,
  phone                 text,
  website               text,
  industry              text,
  country               text,
  source                text not null default 'website',
  service_id            uuid references public.services(id) on delete set null,
  requested_service     text,
  budget_cents          bigint check (budget_cents >= 0),
  budget_range          text,
  timeline              text,
  desired_start_date    date,
  description           text,
  assigned_to           uuid references public.profiles(id) on delete set null,
  qualification_score   int check (qualification_score between 0 and 100),
  qualification         jsonb not null default '{}'::jsonb,
  priority              public.priority_level not null default 'medium',
  status                public.lead_status not null default 'new',
  follow_up_at          timestamptz,
  lost_reason           text,
  internal_notes        text,
  converted_client_id   uuid references public.clients(id) on delete set null,
  converted_at          timestamptz,
  metadata              jsonb not null default '{}'::jsonb,
  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index leads_org_status_idx on public.leads (organization_id, status) where deleted_at is null;
create index leads_assigned_idx on public.leads (assigned_to);
create index leads_follow_up_idx on public.leads (follow_up_at) where follow_up_at is not null and deleted_at is null;
create index leads_email_idx on public.leads (organization_id, email);
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.clients
  add constraint clients_converted_lead_fk foreign key (converted_from_lead_id) references public.leads(id) on delete set null;

create table public.lead_activities (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  actor_id         uuid references public.profiles(id) on delete set null,
  type             text not null check (type in ('created','note','call','email','meeting','status_change','assignment','follow_up','converted','other')),
  description      text not null,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);
create index lead_activities_lead_idx on public.lead_activities (lead_id, created_at desc);

create table public.lead_notes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  author_id        uuid references public.profiles(id) on delete set null,
  body             text not null check (char_length(body) between 1 and 10000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);
create trigger trg_lead_notes_updated before update on public.lead_notes
  for each row execute function public.set_updated_at();

create table public.meeting_records (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  lead_id           uuid references public.leads(id) on delete set null,
  client_id         uuid references public.clients(id) on delete set null,
  project_id        uuid,
  title             text not null,
  status            public.meeting_status not null default 'requested',
  scheduled_at      timestamptz,
  duration_minutes  int check (duration_minutes between 5 and 600),
  meeting_url       text,
  location          text,
  agenda            text,
  notes             text,
  source            text not null default 'manual',
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index meeting_records_org_idx on public.meeting_records (organization_id, scheduled_at);
create trigger trg_meeting_records_updated before update on public.meeting_records
  for each row execute function public.set_updated_at();

-- Client portal helpers -------------------------------------------------------
create or replace function public.my_client_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select cc.client_id from public.client_contacts cc
  join public.clients c on c.id = cc.client_id and c.deleted_at is null
  where cc.profile_id = (select auth.uid()) and cc.portal_access and cc.deleted_at is null;
$$;

create or replace function public.is_client_user(p_client uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.my_client_ids() id where id = p_client);
$$;

grant execute on function public.my_client_ids(), public.is_client_user(uuid) to authenticated;
revoke execute on function public.my_client_ids(), public.is_client_user(uuid) from anon, public;

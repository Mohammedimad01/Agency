-- =============================================================================
-- COMMUNICATION, NOTIFICATIONS, OUTBOX, AUDIT, RATE LIMITS, WEBSITE CONTENT
-- =============================================================================

create table public.conversations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete cascade,
  project_id       uuid references public.projects(id) on delete cascade,
  subject          text not null default 'General',
  is_internal      boolean not null default false,
  created_by       uuid references public.profiles(id) on delete set null,
  last_message_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (is_internal or client_id is not null)
);
create index conversations_client_idx on public.conversations (client_id);
create index conversations_project_idx on public.conversations (project_id);
create unique index conversations_project_default_uniq on public.conversations (project_id) where project_id is not null and not is_internal and subject = 'Project discussion';
create trigger trg_conversations_updated before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  author_id        uuid references public.profiles(id) on delete set null,
  body             text not null check (char_length(body) between 1 and 20000),
  created_at       timestamptz not null default now(),
  edited_at        timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.message_attachments (
  message_id  uuid not null references public.messages(id) on delete cascade,
  file_id     uuid not null references public.files(id) on delete cascade,
  primary key (message_id, file_id)
);

create table public.conversation_reads (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  last_read_at     timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations(id) on delete cascade,
  recipient_id     uuid not null references public.profiles(id) on delete cascade,
  type             text not null,
  title            text not null,
  body             text,
  link             text,
  entity_type      text,
  entity_id        uuid,
  dedupe_key       text,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;
create unique index notifications_dedupe_uniq on public.notifications (recipient_id, dedupe_key) where dedupe_key is not null;

create table public.notification_preferences (
  profile_id      uuid primary key references public.profiles(id) on delete cascade,
  email_enabled   boolean not null default true,
  email_types     jsonb not null default '{}'::jsonb,  -- {"invoice_generated": false, ...}
  updated_at      timestamptz not null default now()
);
create trigger trg_notification_preferences_updated before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Transactional email outbox: idempotent, retried with backoff by the dispatcher
create table public.email_outbox (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid references public.organizations(id) on delete cascade,
  to_email             extensions.citext not null,
  to_name              text,
  template             text not null,
  payload              jsonb not null default '{}'::jsonb,
  idempotency_key      text not null unique,
  status               public.email_status not null default 'pending',
  attempts             int not null default 0,
  max_attempts         int not null default 5,
  last_error           text,
  next_attempt_at      timestamptz not null default now(),
  locked_at            timestamptz,
  sent_at              timestamptz,
  provider             text,
  provider_message_id  text,
  created_at           timestamptz not null default now()
);
create index email_outbox_pending_idx on public.email_outbox (next_attempt_at) where status in ('pending','failed');

-- Activity / audit log
create table public.activity_logs (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  actor_id           uuid references public.profiles(id) on delete set null,
  entity_type        text not null,
  entity_id          uuid,
  action             text not null,
  description        text not null,
  metadata           jsonb not null default '{}'::jsonb,
  client_id          uuid references public.clients(id) on delete cascade,
  project_id         uuid references public.projects(id) on delete cascade,
  is_client_visible  boolean not null default false,
  created_at         timestamptz not null default now()
);
create index activity_logs_org_idx on public.activity_logs (organization_id, created_at desc);
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id, created_at desc);
create index activity_logs_project_idx on public.activity_logs (project_id, created_at desc);
create index activity_logs_client_idx on public.activity_logs (client_id, created_at desc);

-- Fixed-window rate limiting for public endpoints (service role only)
create table private.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         int not null default 0,
  primary key (key, window_start)
);

create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_window timestamptz; v_count int;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into private.rate_limits (key, window_start, count) values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = private.rate_limits.count + 1
  returning count into v_count;
  delete from private.rate_limits where window_start < now() - interval '1 day';
  return v_count <= p_max;
end $$;
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;

-- ---------------------------------------------------------------------------
-- Website content (editable from /admin/website)
-- ---------------------------------------------------------------------------
create table public.portfolio_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null,
  client_name      text,
  industry         text,
  year             int check (year between 1990 and 2100),
  summary          text,
  challenge        text,
  solution         text,
  results          text,
  metrics          jsonb not null default '[]'::jsonb,   -- [{"label":"Conversion","value":"+38%"}]
  cover_image_url  text,
  services         text[] not null default '{}',
  tech_stack       text[] not null default '{}',
  project_url      text,
  is_published     boolean not null default false,
  is_featured      boolean not null default false,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, slug)
);
create trigger trg_portfolio_items_updated before update on public.portfolio_items
  for each row execute function public.set_updated_at();

create table public.testimonials (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  author_name      text not null,
  author_title     text,
  company          text,
  quote            text not null,
  rating           int check (rating between 1 and 5),
  client_id        uuid references public.clients(id) on delete set null,
  is_published     boolean not null default false,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.set_updated_at();

create table public.faqs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  question         text not null,
  answer           text not null,
  category         text not null default 'general',
  is_published     boolean not null default true,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_faqs_updated before update on public.faqs
  for each row execute function public.set_updated_at();

-- Conversation access helper (team or client)
create or replace function public.can_access_conversation(p_conversation uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation and (
      -- team side
      (public.is_org_member(c.organization_id) and (
          case when c.project_id is not null then public.can_view_project(c.project_id)
               else public.has_permission(c.organization_id, 'clients.view') or c.created_by = (select auth.uid()) end))
      -- client side: never internal threads
      or (not c.is_internal and c.client_id is not null and public.is_client_user(c.client_id)
          and (c.project_id is null or public.client_can_view_project(c.project_id)))
    )
  );
$$;
grant execute on function public.can_access_conversation(uuid) to authenticated;
revoke execute on function public.can_access_conversation(uuid) from anon, public;

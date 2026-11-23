-- =============================================================================
-- PROJECT DELIVERY: templates, projects, milestones, tasks, files, deliverables
-- =============================================================================

create table public.project_templates (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  description      text,
  service_id       uuid references public.services(id) on delete set null,
  is_active        boolean not null default true,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_project_templates_updated before update on public.project_templates
  for each row execute function public.set_updated_at();

create table public.project_template_milestones (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references public.project_templates(id) on delete cascade,
  title          text not null,
  description    text,
  sort_order     int not null default 0,
  offset_days    int not null default 0 check (offset_days >= 0),
  duration_days  int not null default 7 check (duration_days >= 0),
  weight         int not null default 1 check (weight between 1 and 100),
  is_client_visible boolean not null default true
);
create index ptm_template_idx on public.project_template_milestones (template_id, sort_order);

create table public.project_template_tasks (
  id                 uuid primary key default gen_random_uuid(),
  template_id        uuid not null references public.project_templates(id) on delete cascade,
  milestone_id       uuid references public.project_template_milestones(id) on delete cascade,
  title              text not null,
  description        text,
  sort_order         int not null default 0,
  offset_days        int not null default 0 check (offset_days >= 0),
  estimated_hours    numeric(8,2) check (estimated_hours >= 0),
  is_client_visible  boolean not null default false,
  requires_client_action boolean not null default false,
  default_role       text references public.roles(key)
);
create index ptt_template_idx on public.project_template_tasks (template_id, sort_order);

create table public.projects (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  code                  text not null,
  name                  text not null check (char_length(name) between 1 and 200),
  client_id             uuid not null references public.clients(id) on delete restrict,
  service_id            uuid references public.services(id) on delete set null,
  template_id           uuid references public.project_templates(id) on delete set null,
  proposal_id           uuid,
  lead_id               uuid references public.leads(id) on delete set null,
  description           text,
  scope                 text,
  budget_cents          bigint check (budget_cents >= 0),
  contract_value_cents  bigint check (contract_value_cents >= 0),
  start_date            date,
  due_date              date,
  completed_at          timestamptz,
  priority              public.priority_level not null default 'medium',
  status                public.project_status not null default 'draft',
  progress              int not null default 0 check (progress between 0 and 100),
  progress_mode         text not null default 'milestones' check (progress_mode in ('milestones','manual')),
  project_manager_id    uuid references public.profiles(id) on delete set null,
  internal_notes        text,
  review_requested_at   timestamptz,
  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  unique (organization_id, code),
  check (due_date is null or start_date is null or due_date >= start_date)
);
create index projects_org_status_idx on public.projects (organization_id, status) where deleted_at is null;
create index projects_client_idx on public.projects (client_id);
create index projects_pm_idx on public.projects (project_manager_id);
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.meeting_records
  add constraint meeting_records_project_fk foreign key (project_id) references public.projects(id) on delete set null;

create table public.project_members (
  project_id  uuid not null references public.projects(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        text,
  added_by    uuid references public.profiles(id) on delete set null,
  added_at    timestamptz not null default now(),
  primary key (project_id, profile_id)
);
create index project_members_profile_idx on public.project_members (profile_id);

create table public.milestones (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  project_id         uuid not null references public.projects(id) on delete cascade,
  title              text not null,
  description        text,
  status             public.milestone_status not null default 'pending',
  start_date         date,
  due_date           date,
  completed_at       timestamptz,
  sort_order         int not null default 0,
  weight             int not null default 1 check (weight between 1 and 100),
  is_client_visible  boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index milestones_project_idx on public.milestones (project_id, sort_order);
create trigger trg_milestones_updated before update on public.milestones
  for each row execute function public.set_updated_at();

create table public.tasks (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  project_id              uuid not null references public.projects(id) on delete cascade,
  milestone_id            uuid references public.milestones(id) on delete set null,
  parent_task_id          uuid references public.tasks(id) on delete cascade,
  title                   text not null check (char_length(title) between 1 and 300),
  description             text,
  status                  public.task_status not null default 'todo',
  priority                public.priority_level not null default 'medium',
  assignee_id             uuid references public.profiles(id) on delete set null,
  start_date              date,
  due_date                date,
  estimated_hours         numeric(8,2) check (estimated_hours >= 0),
  completed_at            timestamptz,
  sort_order              int not null default 0,
  is_client_visible       boolean not null default false,
  requires_client_action  boolean not null default false,
  created_by              uuid references public.profiles(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);
create index tasks_project_idx on public.tasks (project_id, status) where deleted_at is null;
create index tasks_assignee_idx on public.tasks (assignee_id, status) where deleted_at is null;
create index tasks_milestone_idx on public.tasks (milestone_id);
create index tasks_parent_idx on public.tasks (parent_task_id);
create index tasks_due_idx on public.tasks (due_date) where deleted_at is null and status <> 'done';
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.task_comments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  task_id          uuid not null references public.tasks(id) on delete cascade,
  author_id        uuid references public.profiles(id) on delete set null,
  body             text not null check (char_length(body) between 1 and 10000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index task_comments_task_idx on public.task_comments (task_id, created_at);
create trigger trg_task_comments_updated before update on public.task_comments
  for each row execute function public.set_updated_at();

create table public.time_entries (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  project_id       uuid not null references public.projects(id) on delete cascade,
  task_id          uuid references public.tasks(id) on delete set null,
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  entry_date       date not null default current_date,
  minutes          int not null check (minutes between 1 and 1440),
  description      text,
  billable         boolean not null default true,
  created_at       timestamptz not null default now()
);
create index time_entries_project_idx on public.time_entries (project_id, entry_date);
create index time_entries_profile_idx on public.time_entries (profile_id, entry_date);

-- Files: metadata for every object stored in Supabase Storage -----------------
create table public.files (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  bucket           text not null,
  path             text not null,
  name             text not null,
  mime_type        text not null,
  size_bytes       bigint not null check (size_bytes >= 0),
  category         text not null default 'attachment'
                   check (category in ('attachment','deliverable','contract','receipt','document','message','brief','proposal')),
  visibility       public.file_visibility not null default 'internal',
  project_id       uuid references public.projects(id) on delete cascade,
  client_id        uuid references public.clients(id) on delete cascade,
  task_id          uuid references public.tasks(id) on delete set null,
  uploaded_by      uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (bucket, path)
);
create index files_project_idx on public.files (project_id) where deleted_at is null;
create index files_client_idx on public.files (client_id) where deleted_at is null;

create table public.deliverables (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  project_id       uuid not null references public.projects(id) on delete cascade,
  milestone_id     uuid references public.milestones(id) on delete set null,
  title            text not null,
  description      text,
  status           public.deliverable_status not null default 'draft',
  current_version  int not null default 0,
  due_date         date,
  submitted_at     timestamptz,
  approved_at      timestamptz,
  approved_by      uuid references public.profiles(id) on delete set null,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index deliverables_project_idx on public.deliverables (project_id);
create trigger trg_deliverables_updated before update on public.deliverables
  for each row execute function public.set_updated_at();

create table public.deliverable_versions (
  id              uuid primary key default gen_random_uuid(),
  deliverable_id  uuid not null references public.deliverables(id) on delete cascade,
  version         int not null check (version > 0),
  file_id         uuid references public.files(id) on delete set null,
  external_url    text,
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (deliverable_id, version),
  check (file_id is not null or external_url is not null)
);

create table public.deliverable_reviews (
  id              uuid primary key default gen_random_uuid(),
  deliverable_id  uuid not null references public.deliverables(id) on delete cascade,
  version         int not null,
  reviewer_id     uuid references public.profiles(id) on delete set null,
  decision        public.review_decision not null,
  feedback        text,
  created_at      timestamptz not null default now()
);
create index deliverable_reviews_idx on public.deliverable_reviews (deliverable_id, created_at desc);

create table public.revisions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  project_id       uuid not null references public.projects(id) on delete cascade,
  deliverable_id   uuid references public.deliverables(id) on delete cascade,
  review_id        uuid references public.deliverable_reviews(id) on delete set null,
  requested_by     uuid references public.profiles(id) on delete set null,
  description      text not null,
  status           public.revision_status not null default 'open',
  resolved_at      timestamptz,
  resolved_by      uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index revisions_project_idx on public.revisions (project_id, status);
create trigger trg_revisions_updated before update on public.revisions
  for each row execute function public.set_updated_at();

-- Project access helpers ------------------------------------------------------
create or replace function public.is_project_member(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project
      and public.is_org_member(p.organization_id)
      and (p.project_manager_id = (select auth.uid())
           or exists (select 1 from public.project_members pm
                      where pm.project_id = p.id and pm.profile_id = (select auth.uid())))
  );
$$;

-- Team-side visibility (clients use portal_* views instead)
create or replace function public.can_view_project(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project
      and (public.has_permission(p.organization_id, 'projects.view_all') or public.is_project_member(p.id))
  );
$$;

create or replace function public.can_manage_project(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project
      and public.is_org_member(p.organization_id)
      and (public.has_permission(p.organization_id, 'projects.manage') or p.project_manager_id = (select auth.uid()))
  );
$$;

-- Client-side visibility: client user of the project's client, project not draft/deleted
create or replace function public.client_can_view_project(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and p.deleted_at is null and p.status <> 'draft'
      and public.is_client_user(p.client_id)
  );
$$;

grant execute on function public.is_project_member(uuid), public.can_view_project(uuid),
  public.can_manage_project(uuid), public.client_can_view_project(uuid) to authenticated;
revoke execute on function public.is_project_member(uuid), public.can_view_project(uuid),
  public.can_manage_project(uuid), public.client_can_view_project(uuid) from anon, public;

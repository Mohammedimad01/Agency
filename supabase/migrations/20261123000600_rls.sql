-- =============================================================================
-- ROW LEVEL SECURITY
-- Team members: permission-based access inside their organization.
-- Clients: read ONLY through portal_* views and act through portal_* RPCs,
--          except notifications and conversations/messages (needed for Realtime).
-- All policies target `authenticated` (or `anon` for published website content).
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','roles','permissions','role_permissions','team_members','settings',
    'services','clients','client_contacts','leads','lead_activities','lead_notes','meeting_records',
    'project_templates','project_template_milestones','project_template_tasks','projects','project_finances','project_members',
    'milestones','tasks','task_comments','time_entries','files','deliverables','deliverable_versions',
    'deliverable_reviews','revisions','proposals','proposal_items','contracts','contract_versions',
    'invoices','invoice_items','payments','expenses','conversations','messages','message_attachments',
    'conversation_reads','notifications','notification_preferences','email_outbox','activity_logs',
    'portfolio_items','testimonials','faqs']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- email_outbox: no policies at all => service role only.
revoke all on public.email_outbox from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Organizations / identity
-- ---------------------------------------------------------------------------
create policy "orgs: public read" on public.organizations for select to anon, authenticated using (true);
create policy "orgs: settings managers update" on public.organizations for update to authenticated
  using (public.has_permission(id, 'settings.manage')) with check (public.has_permission(id, 'settings.manage'));

create or replace function private.can_see_profile(p_target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_target = (select auth.uid())
    -- teammates in my organizations
    or exists (select 1 from public.team_members tm
               where tm.profile_id = p_target and tm.organization_id in (select public.user_org_ids()))
    -- client contacts of my organizations (requires clients.view)
    or exists (select 1 from public.client_contacts cc
               where cc.profile_id = p_target and public.has_permission(cc.organization_id, 'clients.view'))
    -- clients can see the agency team of the organizations they are clients of
    or exists (select 1 from public.team_members tm
               join public.clients c on c.organization_id = tm.organization_id
               where tm.profile_id = p_target and tm.status = 'active' and c.id in (select public.my_client_ids()));
$$;
grant usage on schema private to authenticated;
grant execute on function private.can_see_profile(uuid) to authenticated;

create policy "profiles: visible" on public.profiles for select to authenticated using (private.can_see_profile(id));
create policy "profiles: self update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "roles: read" on public.roles for select to authenticated using (true);
create policy "permissions: read" on public.permissions for select to authenticated using (true);
create policy "role_permissions: read" on public.role_permissions for select to authenticated using (true);

create policy "team: members read" on public.team_members for select to authenticated
  using (public.is_org_member(organization_id) or profile_id = (select auth.uid()));
create policy "team: managers insert" on public.team_members for insert to authenticated
  with check (public.has_permission(organization_id, 'team.manage'));
create policy "team: managers update" on public.team_members for update to authenticated
  using (public.has_permission(organization_id, 'team.manage'))
  with check (public.has_permission(organization_id, 'team.manage'));
create policy "team: managers delete" on public.team_members for delete to authenticated
  using (public.has_permission(organization_id, 'team.manage'));

-- Only owners may grant/modify/remove the owner role; the last owner cannot be removed.
create or replace function private.guard_team_members()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_actor_role text; v_org uuid; v_owners int;
begin
  v_org := coalesce(new.organization_id, old.organization_id);
  if (select auth.uid()) is null then  -- service role / migrations / triggers
    return coalesce(new, old);
  end if;
  select role_key into v_actor_role from public.team_members
    where organization_id = v_org and profile_id = (select auth.uid()) and status = 'active';
  if (tg_op in ('UPDATE','DELETE') and old.role_key = 'owner') or (tg_op in ('INSERT','UPDATE') and new.role_key = 'owner') then
    if v_actor_role is distinct from 'owner' then
      raise exception 'Only an owner can grant, change or remove the owner role.' using errcode = 'insufficient_privilege';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.profile_id = (select auth.uid()) and new.status <> 'active' then
    raise exception 'You cannot deactivate your own account.' using errcode = 'check_violation';
  end if;
  if (tg_op = 'DELETE' and old.role_key = 'owner')
     or (tg_op = 'UPDATE' and old.role_key = 'owner' and (new.role_key <> 'owner' or new.status <> 'active')) then
    select count(*) into v_owners from public.team_members
      where organization_id = v_org and role_key = 'owner' and status = 'active' and id <> old.id;
    if v_owners = 0 then
      raise exception 'An organization must keep at least one active owner.' using errcode = 'check_violation';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger trg_team_members_guard before insert or update or delete on public.team_members
  for each row execute function private.guard_team_members();

create policy "settings: members read" on public.settings for select to authenticated
  using (public.is_org_member(organization_id));
create policy "settings: managers update" on public.settings for update to authenticated
  using (public.has_permission(organization_id, 'settings.manage'))
  with check (public.has_permission(organization_id, 'settings.manage'));

-- ---------------------------------------------------------------------------
-- CRM
-- ---------------------------------------------------------------------------
create policy "services: public read active" on public.services for select to anon, authenticated
  using (is_public and is_active);
create policy "services: team read" on public.services for select to authenticated
  using (public.is_org_member(organization_id));
create policy "services: manage" on public.services for all to authenticated
  using (public.has_permission(organization_id, 'services.manage'))
  with check (public.has_permission(organization_id, 'services.manage'));

create policy "clients: read" on public.clients for select to authenticated using (
  public.has_permission(organization_id, 'clients.view')
  or (public.is_org_member(organization_id) and exists (
        select 1 from public.projects p where p.client_id = clients.id and public.is_project_member(p.id))));
create policy "clients: insert" on public.clients for insert to authenticated
  with check (public.has_permission(organization_id, 'clients.manage'));
create policy "clients: update" on public.clients for update to authenticated
  using (public.has_permission(organization_id, 'clients.manage'))
  with check (public.has_permission(organization_id, 'clients.manage'));
create policy "clients: delete" on public.clients for delete to authenticated
  using (public.has_permission(organization_id, 'clients.manage'));

create policy "contacts: read" on public.client_contacts for select to authenticated
  using (public.has_permission(organization_id, 'clients.view'));
create policy "contacts: manage" on public.client_contacts for all to authenticated
  using (public.has_permission(organization_id, 'clients.manage'))
  with check (public.has_permission(organization_id, 'clients.manage'));

create policy "leads: read" on public.leads for select to authenticated using (
  public.has_permission(organization_id, 'leads.view')
  or (assigned_to = (select auth.uid()) and public.is_org_member(organization_id)));
create policy "leads: insert" on public.leads for insert to authenticated
  with check (public.has_permission(organization_id, 'leads.manage'));
create policy "leads: update" on public.leads for update to authenticated using (
  public.has_permission(organization_id, 'leads.manage')
  or (assigned_to = (select auth.uid()) and public.is_org_member(organization_id)))
  with check (public.is_org_member(organization_id));
create policy "leads: delete" on public.leads for delete to authenticated
  using (public.has_permission(organization_id, 'leads.manage'));

create policy "lead_activities: read" on public.lead_activities for select to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_id));
create policy "lead_activities: insert" on public.lead_activities for insert to authenticated
  with check (actor_id = (select auth.uid()) and public.is_org_member(organization_id)
              and exists (select 1 from public.leads l where l.id = lead_id and l.organization_id = lead_activities.organization_id));

create policy "lead_notes: read" on public.lead_notes for select to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_id));
create policy "lead_notes: insert" on public.lead_notes for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_org_member(organization_id)
              and exists (select 1 from public.leads l where l.id = lead_id and l.organization_id = lead_notes.organization_id));
create policy "lead_notes: own update" on public.lead_notes for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "lead_notes: own or manager delete" on public.lead_notes for delete to authenticated
  using (author_id = (select auth.uid()) or public.has_permission(organization_id, 'leads.manage'));

create policy "meetings: read" on public.meeting_records for select to authenticated using (
  public.is_org_member(organization_id) and (
    created_by = (select auth.uid()) or public.has_permission(organization_id, 'leads.view')
    or public.has_permission(organization_id, 'clients.view')
    or (project_id is not null and public.can_view_project(project_id))));
create policy "meetings: write" on public.meeting_records for all to authenticated
  using (public.is_org_member(organization_id) and (created_by = (select auth.uid())
         or public.has_permission(organization_id, 'leads.manage') or public.has_permission(organization_id, 'clients.manage')))
  with check (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- Projects & delivery
-- ---------------------------------------------------------------------------
create policy "templates: read" on public.project_templates for select to authenticated
  using (public.is_org_member(organization_id));
create policy "templates: manage" on public.project_templates for all to authenticated
  using (public.has_permission(organization_id, 'templates.manage'))
  with check (public.has_permission(organization_id, 'templates.manage'));

create policy "template milestones: read" on public.project_template_milestones for select to authenticated
  using (exists (select 1 from public.project_templates t where t.id = template_id and public.is_org_member(t.organization_id)));
create policy "template milestones: manage" on public.project_template_milestones for all to authenticated
  using (exists (select 1 from public.project_templates t where t.id = template_id and public.has_permission(t.organization_id, 'templates.manage')))
  with check (exists (select 1 from public.project_templates t where t.id = template_id and public.has_permission(t.organization_id, 'templates.manage')));

create policy "template tasks: read" on public.project_template_tasks for select to authenticated
  using (exists (select 1 from public.project_templates t where t.id = template_id and public.is_org_member(t.organization_id)));
create policy "template tasks: manage" on public.project_template_tasks for all to authenticated
  using (exists (select 1 from public.project_templates t where t.id = template_id and public.has_permission(t.organization_id, 'templates.manage')))
  with check (exists (select 1 from public.project_templates t where t.id = template_id and public.has_permission(t.organization_id, 'templates.manage')));

create policy "projects: read" on public.projects for select to authenticated using (
  public.has_permission(organization_id, 'projects.view_all')
  or (public.is_org_member(organization_id) and (
        project_manager_id = (select auth.uid())
        or exists (select 1 from public.project_members pm where pm.project_id = projects.id and pm.profile_id = (select auth.uid())))));
create policy "projects: insert" on public.projects for insert to authenticated
  with check (public.has_permission(organization_id, 'projects.manage'));
create policy "projects: update" on public.projects for update to authenticated
  using (public.can_manage_project(id)) with check (public.is_org_member(organization_id));
create policy "projects: delete" on public.projects for delete to authenticated
  using (public.has_permission(organization_id, 'projects.manage'));

create policy "project_finances: read" on public.project_finances for select to authenticated
  using (public.has_permission(organization_id, 'finance.view') or public.has_permission(organization_id, 'projects.manage'));
create policy "project_finances: write" on public.project_finances for all to authenticated
  using (public.has_permission(organization_id, 'finance.manage') or public.has_permission(organization_id, 'projects.manage'))
  with check ((public.has_permission(organization_id, 'finance.manage') or public.has_permission(organization_id, 'projects.manage'))
              and organization_id = (select p.organization_id from public.projects p where p.id = project_id));

create policy "project_members: read" on public.project_members for select to authenticated
  using (public.can_view_project(project_id));
create policy "project_members: manage" on public.project_members for all to authenticated
  using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

create policy "milestones: read" on public.milestones for select to authenticated using (public.can_view_project(project_id));
create policy "milestones: manage" on public.milestones for all to authenticated
  using (public.can_manage_project(project_id))
  with check (public.can_manage_project(project_id)
              and organization_id = (select p.organization_id from public.projects p where p.id = project_id));

create policy "tasks: read" on public.tasks for select to authenticated using (public.can_view_project(project_id));
create policy "tasks: insert" on public.tasks for insert to authenticated
  with check ((public.can_manage_project(project_id) or public.is_project_member(project_id))
              and organization_id = (select p.organization_id from public.projects p where p.id = project_id));
create policy "tasks: update" on public.tasks for update to authenticated
  using (public.can_manage_project(project_id) or public.is_project_member(project_id) or assignee_id = (select auth.uid()))
  with check (public.can_view_project(project_id));
create policy "tasks: delete" on public.tasks for delete to authenticated using (public.can_manage_project(project_id));

create policy "task_comments: read" on public.task_comments for select to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id and public.can_view_project(t.project_id)));
create policy "task_comments: insert" on public.task_comments for insert to authenticated
  with check (author_id = (select auth.uid())
              and exists (select 1 from public.tasks t where t.id = task_id and t.organization_id = task_comments.organization_id and public.can_view_project(t.project_id)));
create policy "task_comments: own update" on public.task_comments for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "task_comments: own delete" on public.task_comments for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "time: read" on public.time_entries for select to authenticated
  using (profile_id = (select auth.uid()) or public.can_manage_project(project_id) or public.has_permission(organization_id, 'reports.view'));
create policy "time: own insert" on public.time_entries for insert to authenticated
  with check (profile_id = (select auth.uid()) and public.can_view_project(project_id));
create policy "time: own update" on public.time_entries for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "time: own delete" on public.time_entries for delete to authenticated
  using (profile_id = (select auth.uid()) or public.can_manage_project(project_id));

create policy "files: team read" on public.files for select to authenticated using (
  public.is_org_member(organization_id) and (
    case
      when project_id is not null then public.can_view_project(project_id)
      when category = 'receipt' then public.has_permission(organization_id, 'finance.view')
      when category = 'contract' then public.has_permission(organization_id, 'contracts.view')
      else public.has_permission(organization_id, 'clients.view') or uploaded_by = (select auth.uid())
    end));
create policy "files: team insert" on public.files for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and public.is_org_member(organization_id)
              and (project_id is null or public.can_view_project(project_id)));
create policy "files: team update" on public.files for update to authenticated
  using (public.is_org_member(organization_id) and (uploaded_by = (select auth.uid()) or (project_id is not null and public.can_manage_project(project_id))))
  with check (public.is_org_member(organization_id));

create policy "deliverables: read" on public.deliverables for select to authenticated using (public.can_view_project(project_id));
create policy "deliverables: write" on public.deliverables for all to authenticated
  using (public.can_manage_project(project_id) or public.is_project_member(project_id))
  with check ((public.can_manage_project(project_id) or public.is_project_member(project_id))
              and organization_id = (select p.organization_id from public.projects p where p.id = project_id));

create policy "deliverable_versions: read" on public.deliverable_versions for select to authenticated
  using (exists (select 1 from public.deliverables d where d.id = deliverable_id and public.can_view_project(d.project_id)));
create policy "deliverable_versions: write" on public.deliverable_versions for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (select 1 from public.deliverables d where d.id = deliverable_id
              and (public.can_manage_project(d.project_id) or public.is_project_member(d.project_id))));

create policy "deliverable_reviews: read" on public.deliverable_reviews for select to authenticated
  using (exists (select 1 from public.deliverables d where d.id = deliverable_id and public.can_view_project(d.project_id)));

create policy "revisions: read" on public.revisions for select to authenticated using (public.can_view_project(project_id));
create policy "revisions: write" on public.revisions for all to authenticated
  using (public.can_manage_project(project_id) or public.is_project_member(project_id))
  with check (public.can_manage_project(project_id) or public.is_project_member(project_id));

-- ---------------------------------------------------------------------------
-- Sales & finance (never visible to non-finance roles by default)
-- ---------------------------------------------------------------------------
create policy "proposals: read" on public.proposals for select to authenticated
  using (public.has_permission(organization_id, 'proposals.view'));
create policy "proposals: manage" on public.proposals for all to authenticated
  using (public.has_permission(organization_id, 'proposals.manage'))
  with check (public.has_permission(organization_id, 'proposals.manage'));
create policy "proposal_items: read" on public.proposal_items for select to authenticated
  using (exists (select 1 from public.proposals p where p.id = proposal_id and public.has_permission(p.organization_id, 'proposals.view')));
create policy "proposal_items: manage" on public.proposal_items for all to authenticated
  using (exists (select 1 from public.proposals p where p.id = proposal_id and public.has_permission(p.organization_id, 'proposals.manage')))
  with check (exists (select 1 from public.proposals p where p.id = proposal_id and public.has_permission(p.organization_id, 'proposals.manage')));

create policy "contracts: read" on public.contracts for select to authenticated
  using (public.has_permission(organization_id, 'contracts.view'));
create policy "contracts: manage" on public.contracts for all to authenticated
  using (public.has_permission(organization_id, 'contracts.manage'))
  with check (public.has_permission(organization_id, 'contracts.manage'));
create policy "contract_versions: read" on public.contract_versions for select to authenticated
  using (exists (select 1 from public.contracts c where c.id = contract_id and public.has_permission(c.organization_id, 'contracts.view')));
create policy "contract_versions: manage" on public.contract_versions for insert to authenticated
  with check (exists (select 1 from public.contracts c where c.id = contract_id and public.has_permission(c.organization_id, 'contracts.manage')));

create policy "invoices: read" on public.invoices for select to authenticated
  using (public.has_permission(organization_id, 'finance.view'));
create policy "invoices: manage" on public.invoices for all to authenticated
  using (public.has_permission(organization_id, 'finance.manage'))
  with check (public.has_permission(organization_id, 'finance.manage'));
create policy "invoice_items: read" on public.invoice_items for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_permission(i.organization_id, 'finance.view')));
create policy "invoice_items: manage" on public.invoice_items for all to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_permission(i.organization_id, 'finance.manage')))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and public.has_permission(i.organization_id, 'finance.manage')));

-- Payments are an append-only ledger: no DELETE policy. Corrections use status (failed/refunded).
create policy "payments: read" on public.payments for select to authenticated
  using (public.has_permission(organization_id, 'finance.view'));
create policy "payments: insert" on public.payments for insert to authenticated
  with check (public.has_permission(organization_id, 'finance.manage') and recorded_by = (select auth.uid()));
create policy "payments: update" on public.payments for update to authenticated
  using (public.has_permission(organization_id, 'finance.manage'))
  with check (public.has_permission(organization_id, 'finance.manage'));

create policy "expenses: read" on public.expenses for select to authenticated
  using (public.has_permission(organization_id, 'finance.view'));
create policy "expenses: manage" on public.expenses for all to authenticated
  using (public.has_permission(organization_id, 'finance.manage'))
  with check (public.has_permission(organization_id, 'finance.manage'));

-- ---------------------------------------------------------------------------
-- Communication
-- ---------------------------------------------------------------------------
create policy "conversations: read" on public.conversations for select to authenticated
  using (public.can_access_conversation(id));
create policy "conversations: team insert" on public.conversations for insert to authenticated
  with check (created_by = (select auth.uid()) and public.is_org_member(organization_id)
              and (project_id is null or public.can_view_project(project_id)));
create policy "conversations: client insert" on public.conversations for insert to authenticated
  with check (created_by = (select auth.uid()) and not is_internal and public.is_client_user(client_id)
              and organization_id = (select c.organization_id from public.clients c where c.id = client_id)
              and (project_id is null or public.client_can_view_project(project_id)));
create policy "conversations: team update" on public.conversations for update to authenticated
  using (public.is_org_member(organization_id) and public.can_access_conversation(id))
  with check (public.is_org_member(organization_id));

create policy "messages: read" on public.messages for select to authenticated
  using (public.can_access_conversation(conversation_id));
create policy "messages: insert" on public.messages for insert to authenticated
  with check (author_id = (select auth.uid()) and public.can_access_conversation(conversation_id));
create policy "messages: own update" on public.messages for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

create policy "message_attachments: read" on public.message_attachments for select to authenticated
  using (exists (select 1 from public.messages m where m.id = message_id and public.can_access_conversation(m.conversation_id)));
create policy "message_attachments: insert" on public.message_attachments for insert to authenticated
  with check (exists (select 1 from public.messages m where m.id = message_id and m.author_id = (select auth.uid())));

create policy "reads: own" on public.conversation_reads for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()) and public.can_access_conversation(conversation_id));

create policy "notifications: own read" on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy "notifications: own update" on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy "notifications: own delete" on public.notifications for delete to authenticated
  using (recipient_id = (select auth.uid()));

create policy "notification_prefs: own" on public.notification_preferences for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy "activity: team read" on public.activity_logs for select to authenticated using (
  public.is_org_member(organization_id)
  and (entity_type not in ('invoice','payment','expense','proposal','contract') or public.has_permission(organization_id, 'finance.view')
       or (entity_type in ('proposal') and public.has_permission(organization_id, 'proposals.view'))
       or (entity_type in ('contract') and public.has_permission(organization_id, 'contracts.view')))
  and (project_id is null or public.can_view_project(project_id))
  and (entity_type <> 'lead' or public.has_permission(organization_id, 'leads.view'))
  and (client_id is null or project_id is not null or public.has_permission(organization_id, 'clients.view')));
create policy "activity: team insert" on public.activity_logs for insert to authenticated
  with check (actor_id = (select auth.uid()) and public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- Website content
-- ---------------------------------------------------------------------------
create policy "portfolio: public read" on public.portfolio_items for select to anon, authenticated using (is_published);
create policy "portfolio: team read" on public.portfolio_items for select to authenticated using (public.is_org_member(organization_id));
create policy "portfolio: manage" on public.portfolio_items for all to authenticated
  using (public.has_permission(organization_id, 'content.manage'))
  with check (public.has_permission(organization_id, 'content.manage'));

create policy "testimonials: public read" on public.testimonials for select to anon, authenticated using (is_published);
create policy "testimonials: team read" on public.testimonials for select to authenticated using (public.is_org_member(organization_id));
create policy "testimonials: manage" on public.testimonials for all to authenticated
  using (public.has_permission(organization_id, 'content.manage'))
  with check (public.has_permission(organization_id, 'content.manage'));

create policy "faqs: public read" on public.faqs for select to anon, authenticated using (is_published);
create policy "faqs: team read" on public.faqs for select to authenticated using (public.is_org_member(organization_id));
create policy "faqs: manage" on public.faqs for all to authenticated
  using (public.has_permission(organization_id, 'content.manage'))
  with check (public.has_permission(organization_id, 'content.manage'));

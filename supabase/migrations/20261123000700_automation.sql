-- =============================================================================
-- AUTOMATION ENGINE
-- Event-driven workflows implemented with triggers. Every side effect is
-- idempotent: notifications use (recipient, dedupe_key), emails use the
-- outbox idempotency_key, financial rows are guarded by constraints.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Primitives
-- ---------------------------------------------------------------------------
create or replace function private.notify(
  p_recipient uuid, p_org uuid, p_type text, p_title text, p_body text, p_link text,
  p_entity_type text default null, p_entity_id uuid default null, p_dedupe text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_recipient is null then return; end if;
  insert into public.notifications (recipient_id, organization_id, type, title, body, link, entity_type, entity_id, dedupe_key)
  values (p_recipient, p_org, p_type, p_title, p_body, p_link, p_entity_type, p_entity_id, p_dedupe)
  on conflict (recipient_id, dedupe_key) where dedupe_key is not null do nothing;
end $$;

-- Notify every active team member holding a permission (optionally excluding the actor)
create or replace function private.notify_permission(
  p_org uuid, p_perm text, p_type text, p_title text, p_body text, p_link text,
  p_entity_type text, p_entity_id uuid, p_dedupe text default null, p_exclude uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select tm.profile_id from public.team_members tm
    where tm.organization_id = p_org and tm.status = 'active'
      and (tm.role_key = 'owner' or exists (select 1 from public.role_permissions rp where rp.role_key = tm.role_key and rp.permission_key = p_perm))
      and tm.profile_id is distinct from p_exclude
  loop
    perform private.notify(r.profile_id, p_org, p_type, p_title, p_body, p_link, p_entity_type, p_entity_id, p_dedupe);
  end loop;
end $$;

create or replace function private.notify_project_team(
  p_project uuid, p_type text, p_title text, p_body text, p_link text,
  p_entity_type text, p_entity_id uuid, p_dedupe text default null, p_exclude uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r record; v_org uuid;
begin
  select organization_id into v_org from public.projects where id = p_project;
  for r in
    select distinct x.pid from (
      select project_manager_id as pid from public.projects where id = p_project
      union select profile_id from public.project_members where project_id = p_project) x
    join public.team_members tm on tm.profile_id = x.pid and tm.organization_id = v_org and tm.status = 'active'
    where x.pid is not null and x.pid is distinct from p_exclude
  loop
    perform private.notify(r.pid, v_org, p_type, p_title, p_body, p_link, p_entity_type, p_entity_id, p_dedupe);
  end loop;
end $$;

create or replace function private.notify_client_users(
  p_client uuid, p_type text, p_title text, p_body text, p_link text,
  p_entity_type text, p_entity_id uuid, p_dedupe text default null, p_exclude uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select cc.profile_id, cc.organization_id from public.client_contacts cc
    where cc.client_id = p_client and cc.portal_access and cc.profile_id is not null and cc.deleted_at is null
      and cc.profile_id is distinct from p_exclude
  loop
    perform private.notify(r.profile_id, r.organization_id, p_type, p_title, p_body, p_link, p_entity_type, p_entity_id, p_dedupe);
  end loop;
end $$;

create or replace function private.enqueue_email(
  p_org uuid, p_to text, p_to_name text, p_template text, p_payload jsonb, p_key text,
  p_delay interval default interval '0')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_to is null or p_to = '' then return; end if;
  insert into public.email_outbox (organization_id, to_email, to_name, template, payload, idempotency_key, next_attempt_at)
  values (p_org, p_to, p_to_name, p_template, coalesce(p_payload, '{}'::jsonb), p_key, now() + p_delay)
  on conflict (idempotency_key) do nothing;
end $$;

-- Email every portal-enabled contact of a client (falls back to the primary contact / client email)
create or replace function private.email_client_contacts(
  p_client uuid, p_template text, p_payload jsonb, p_key text, p_delay interval default interval '0')
returns void language plpgsql security definer set search_path = '' as $$
declare r record; v_sent int := 0; v_client public.clients%rowtype;
begin
  select * into v_client from public.clients where id = p_client;
  if not found then return; end if;
  for r in
    select email, full_name from public.client_contacts
    where client_id = p_client and deleted_at is null and (portal_access or is_primary)
  loop
    perform private.enqueue_email(v_client.organization_id, r.email, r.full_name, p_template,
      p_payload || jsonb_build_object('recipient_name', r.full_name), p_key || ':' || lower(r.email), p_delay);
    v_sent := v_sent + 1;
  end loop;
  if v_sent = 0 and v_client.email is not null then
    perform private.enqueue_email(v_client.organization_id, v_client.email, v_client.name, p_template,
      p_payload || jsonb_build_object('recipient_name', v_client.name), p_key || ':' || lower(v_client.email), p_delay);
  end if;
end $$;

create or replace function private.log_activity(
  p_org uuid, p_entity_type text, p_entity_id uuid, p_action text, p_description text,
  p_metadata jsonb default '{}'::jsonb, p_client uuid default null, p_project uuid default null,
  p_client_visible boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.activity_logs (organization_id, actor_id, entity_type, entity_id, action, description, metadata, client_id, project_id, is_client_visible)
  values (p_org, (select auth.uid()), p_entity_type, p_entity_id, p_action, p_description, coalesce(p_metadata, '{}'::jsonb), p_client, p_project, p_client_visible);
end $$;

create or replace function private.label(p text)
returns text language sql immutable set search_path = '' as $$
  select initcap(replace(p, '_', ' '));
$$;

-- ---------------------------------------------------------------------------
-- 1-3. Leads: creation notifications, status/assignment history
-- ---------------------------------------------------------------------------
create or replace function private.on_lead_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  insert into public.lead_activities (organization_id, lead_id, actor_id, type, description, metadata)
  values (new.organization_id, new.id, (select auth.uid()), 'created',
          'Lead created from ' || coalesce(new.source, 'unknown source'), jsonb_build_object('source', new.source));

  perform private.notify_permission(new.organization_id, 'leads.view', 'lead_created',
    'New lead: ' || new.full_name,
    coalesce(new.company || ' · ', '') || coalesce(new.requested_service, 'General inquiry'),
    '/admin/leads/' || new.id, 'lead', new.id, 'lead_created:' || new.id, (select auth.uid()));

  -- email owners & admins (they are the people who must react to new business)
  for r in
    select p.email, p.full_name from public.team_members tm join public.profiles p on p.id = tm.profile_id
    where tm.organization_id = new.organization_id and tm.status = 'active' and tm.role_key in ('owner','admin')
  loop
    perform private.enqueue_email(new.organization_id, r.email, r.full_name, 'new_lead',
      jsonb_build_object('lead_id', new.id, 'lead_name', new.full_name, 'company', new.company, 'email', new.email,
                         'service', new.requested_service, 'budget', new.budget_range, 'description', left(coalesce(new.description, ''), 600),
                         'link', '/admin/leads/' || new.id),
      'new_lead:' || new.id || ':' || lower(r.email));
  end loop;

  if new.assigned_to is not null and new.assigned_to is distinct from (select auth.uid()) then
    perform private.notify(new.assigned_to, new.organization_id, 'lead_assigned', 'Lead assigned to you: ' || new.full_name,
      null, '/admin/leads/' || new.id, 'lead', new.id, 'lead_assigned:' || new.id || ':' || new.assigned_to);
  end if;
  return null;
end $$;
create trigger trg_leads_after_insert after insert on public.leads
  for each row execute function private.on_lead_insert();

create or replace function private.on_lead_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_activities (organization_id, lead_id, actor_id, type, description, metadata)
    values (new.organization_id, new.id, (select auth.uid()), 'status_change',
            'Status changed from ' || private.label(old.status::text) || ' to ' || private.label(new.status::text),
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    insert into public.lead_activities (organization_id, lead_id, actor_id, type, description, metadata)
    values (new.organization_id, new.id, (select auth.uid()), 'assignment',
            case when new.assigned_to is null then 'Lead unassigned'
                 else 'Lead assigned to ' || coalesce((select full_name from public.profiles where id = new.assigned_to), 'a teammate') end,
            jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to));
    if new.assigned_to is not null and new.assigned_to is distinct from (select auth.uid()) then
      perform private.notify(new.assigned_to, new.organization_id, 'lead_assigned', 'Lead assigned to you: ' || new.full_name,
        null, '/admin/leads/' || new.id, 'lead', new.id, 'lead_assigned:' || new.id || ':' || new.assigned_to);
    end if;
  end if;
  if new.follow_up_at is distinct from old.follow_up_at and new.follow_up_at is not null then
    insert into public.lead_activities (organization_id, lead_id, actor_id, type, description, metadata)
    values (new.organization_id, new.id, (select auth.uid()), 'follow_up',
            'Follow-up scheduled for ' || to_char(new.follow_up_at, 'DD Mon YYYY HH24:MI'), jsonb_build_object('at', new.follow_up_at));
  end if;
  return null;
end $$;
create trigger trg_leads_after_update after update on public.leads
  for each row execute function private.on_lead_update();

-- ---------------------------------------------------------------------------
-- Projects: completion, assignment, kickoff, review request (5, 11, 12)
-- ---------------------------------------------------------------------------
create or replace function private.before_project_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    new.completed_at := coalesce(new.completed_at, now());
    new.progress := 100;
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end $$;
create trigger trg_projects_before_change before insert or update on public.projects
  for each row execute function private.before_project_change();

create or replace function private.on_project_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.conversations (organization_id, client_id, project_id, subject, is_internal, created_by)
  values (new.organization_id, new.client_id, new.id, 'Project discussion', false, (select auth.uid()))
  on conflict do nothing;
  perform private.log_activity(new.organization_id, 'project', new.id, 'created', 'Project ' || new.code || ' created: ' || new.name,
    '{}'::jsonb, new.client_id, new.id, false);
  if new.project_manager_id is not null and new.project_manager_id is distinct from (select auth.uid()) then
    perform private.notify(new.project_manager_id, new.organization_id, 'project_assigned', 'You are managing ' || new.name,
      new.code, '/admin/projects/' || new.id, 'project', new.id, 'project_pm:' || new.id || ':' || new.project_manager_id);
  end if;
  if new.status <> 'draft' then
    perform private.notify_client_users(new.client_id, 'project_created', 'New project: ' || new.name,
      'Your project workspace is ready.', '/portal/projects/' || new.id, 'project', new.id, 'project_created:' || new.id);
    perform private.email_client_contacts(new.client_id, 'new_project',
      jsonb_build_object('project_name', new.name, 'project_code', new.code, 'start_date', new.start_date, 'due_date', new.due_date,
                         'link', '/portal/projects/' || new.id), 'new_project:' || new.id);
  end if;
  return null;
end $$;
create trigger trg_projects_after_insert after insert on public.projects
  for each row execute function private.on_project_insert();

create or replace function private.on_project_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    perform private.log_activity(new.organization_id, 'project', new.id, 'status_changed',
      'Project status changed to ' || private.label(new.status::text),
      jsonb_build_object('from', old.status, 'to', new.status), new.client_id, new.id, new.status <> 'draft');

    if old.status = 'draft' and new.status <> 'draft' then
      perform private.notify_client_users(new.client_id, 'project_created', 'New project: ' || new.name,
        'Your project workspace is ready.', '/portal/projects/' || new.id, 'project', new.id, 'project_created:' || new.id);
      perform private.email_client_contacts(new.client_id, 'new_project',
        jsonb_build_object('project_name', new.name, 'project_code', new.code, 'start_date', new.start_date, 'due_date', new.due_date,
                           'link', '/portal/projects/' || new.id), 'new_project:' || new.id);
    end if;

    if new.status = 'completed' then
      perform private.notify_client_users(new.client_id, 'project_completed', new.name || ' is complete',
        'Thank you for working with us.', '/portal/projects/' || new.id, 'project', new.id, 'project_completed:' || new.id);
      perform private.notify_project_team(new.id, 'project_completed', new.name || ' marked complete', null,
        '/admin/projects/' || new.id, 'project', new.id, 'project_completed:' || new.id, (select auth.uid()));
      perform private.email_client_contacts(new.client_id, 'project_completed',
        jsonb_build_object('project_name', new.name, 'project_code', new.code, 'link', '/portal/projects/' || new.id),
        'project_completed:' || new.id);
      -- Review request, three days after completion (once per project)
      perform private.email_client_contacts(new.client_id, 'review_request',
        jsonb_build_object('project_name', new.name, 'link', '/contact?subject=review'),
        'review_request:' || new.id, interval '3 days');
      update public.projects set review_requested_at = now() where id = new.id and review_requested_at is null;
    end if;
  end if;

  if new.project_manager_id is distinct from old.project_manager_id and new.project_manager_id is not null
     and new.project_manager_id is distinct from (select auth.uid()) then
    perform private.notify(new.project_manager_id, new.organization_id, 'project_assigned', 'You are managing ' || new.name,
      new.code, '/admin/projects/' || new.id, 'project', new.id, 'project_pm:' || new.id || ':' || new.project_manager_id);
  end if;
  return null;
end $$;
create trigger trg_projects_after_update after update of status, project_manager_id on public.projects
  for each row execute function private.on_project_update();

create or replace function private.on_project_member_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_project public.projects%rowtype;
begin
  select * into v_project from public.projects where id = new.project_id;
  if new.profile_id is distinct from (select auth.uid()) then
    perform private.notify(new.profile_id, v_project.organization_id, 'project_assigned', 'Added to project: ' || v_project.name,
      v_project.code, '/admin/projects/' || v_project.id, 'project', v_project.id, 'project_member:' || v_project.id || ':' || new.profile_id);
  end if;
  return null;
end $$;
create trigger trg_project_members_after_insert after insert on public.project_members
  for each row execute function private.on_project_member_insert();

-- ---------------------------------------------------------------------------
-- 7. Milestones drive project progress; tasks drive milestone status
-- ---------------------------------------------------------------------------
create or replace function private.recalc_project_progress(p_project uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_total int; v_done int;
begin
  select coalesce(sum(weight), 0), coalesce(sum(weight) filter (where status = 'completed'), 0)
    into v_total, v_done from public.milestones where project_id = p_project;
  update public.projects
     set progress = case when v_total = 0 then 0 else round(100.0 * v_done / v_total)::int end
   where id = p_project and progress_mode = 'milestones' and status <> 'completed';
end $$;

create or replace function private.before_milestone_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'completed' then new.completed_at := coalesce(new.completed_at, now());
  else new.completed_at := null; end if;
  return new;
end $$;
create trigger trg_milestones_before before insert or update on public.milestones
  for each row execute function private.before_milestone_change();

create or replace function private.after_milestone_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_project public.projects%rowtype;
begin
  perform private.recalc_project_progress(coalesce(new.project_id, old.project_id));
  if tg_op = 'UPDATE' and new.status = 'completed' and old.status <> 'completed' then
    select * into v_project from public.projects where id = new.project_id;
    perform private.log_activity(new.organization_id, 'milestone', new.id, 'completed', 'Milestone completed: ' || new.title,
      '{}'::jsonb, v_project.client_id, v_project.id, new.is_client_visible);
    perform private.notify_project_team(new.project_id, 'milestone_completed', 'Milestone completed: ' || new.title, v_project.name,
      '/admin/projects/' || new.project_id, 'milestone', new.id, 'milestone_completed:' || new.id, (select auth.uid()));
    if new.is_client_visible and v_project.status <> 'draft' then
      perform private.notify_client_users(v_project.client_id, 'milestone_completed', 'Milestone completed: ' || new.title,
        v_project.name, '/portal/projects/' || v_project.id, 'milestone', new.id, 'milestone_completed:' || new.id);
      perform private.email_client_contacts(v_project.client_id, 'milestone_update',
        jsonb_build_object('project_name', v_project.name, 'milestone', new.title,
                           'progress', (select progress from public.projects where id = v_project.id),
                           'link', '/portal/projects/' || v_project.id),
        'milestone_completed:' || new.id);
    end if;
  end if;
  return null;
end $$;
create trigger trg_milestones_after after insert or update of status, weight or delete on public.milestones
  for each row execute function private.after_milestone_change();

create or replace function private.before_task_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'done' then new.completed_at := coalesce(new.completed_at, now());
  else new.completed_at := null; end if;
  return new;
end $$;
create trigger trg_tasks_before before insert or update on public.tasks
  for each row execute function private.before_task_change();

create or replace function private.sync_milestone_from_tasks(p_milestone uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_total int; v_done int; v_active int; v_status public.milestone_status;
begin
  if p_milestone is null then return; end if;
  select count(*), count(*) filter (where status = 'done'), count(*) filter (where status <> 'todo')
    into v_total, v_done, v_active
    from public.tasks where milestone_id = p_milestone and deleted_at is null and parent_task_id is null;
  if v_total = 0 then return; end if;
  v_status := (case when v_done = v_total then 'completed'
                    when v_active > 0 then 'in_progress' else 'pending' end)::public.milestone_status;
  update public.milestones set status = v_status where id = p_milestone and status is distinct from v_status;
end $$;

create or replace function private.after_task_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform private.sync_milestone_from_tasks(old.milestone_id);
    return null;
  end if;
  if tg_op = 'INSERT' or new.status is distinct from old.status or new.milestone_id is distinct from old.milestone_id
     or new.deleted_at is distinct from old.deleted_at then
    perform private.sync_milestone_from_tasks(new.milestone_id);
    if tg_op = 'UPDATE' and old.milestone_id is distinct from new.milestone_id then
      perform private.sync_milestone_from_tasks(old.milestone_id);
    end if;
  end if;
  if new.assignee_id is not null and new.assignee_id is distinct from (select auth.uid())
     and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id) then
    perform private.notify(new.assignee_id, new.organization_id, 'task_assigned', 'Task assigned: ' || new.title,
      (select name from public.projects where id = new.project_id), '/admin/projects/' || new.project_id || '?task=' || new.id,
      'task', new.id, 'task_assigned:' || new.id || ':' || new.assignee_id);
  end if;
  return null;
end $$;
create trigger trg_tasks_after after insert or update or delete on public.tasks
  for each row execute function private.after_task_change();

-- ---------------------------------------------------------------------------
-- 8. Deliverables & client reviews
-- ---------------------------------------------------------------------------
create or replace function private.on_deliverable_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_project public.projects%rowtype;
begin
  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    select * into v_project from public.projects where id = new.project_id;
    perform private.log_activity(new.organization_id, 'deliverable', new.id, 'submitted',
      'Deliverable ready for review: ' || new.title || ' (v' || new.current_version || ')', '{}'::jsonb, v_project.client_id, v_project.id, true);
    perform private.notify_client_users(v_project.client_id, 'deliverable_ready', 'Ready for review: ' || new.title,
      v_project.name, '/portal/projects/' || v_project.id || '/deliverables', 'deliverable', new.id,
      'deliverable_ready:' || new.id || ':v' || new.current_version);
    perform private.email_client_contacts(v_project.client_id, 'deliverable_ready',
      jsonb_build_object('project_name', v_project.name, 'deliverable', new.title, 'version', new.current_version,
                         'link', '/portal/projects/' || v_project.id || '/deliverables'),
      'deliverable_ready:' || new.id || ':v' || new.current_version);
  end if;
  return null;
end $$;
create trigger trg_deliverables_after_update after update of status on public.deliverables
  for each row execute function private.on_deliverable_update();

create or replace function private.on_deliverable_review()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_del public.deliverables%rowtype; v_project public.projects%rowtype; v_who text;
begin
  select * into v_del from public.deliverables where id = new.deliverable_id for update;
  select * into v_project from public.projects where id = v_del.project_id;
  select coalesce(full_name, email) into v_who from public.profiles where id = new.reviewer_id;

  if new.decision = 'approved' then
    update public.deliverables set status = 'approved', approved_at = now(), approved_by = new.reviewer_id where id = v_del.id;
    perform private.log_activity(v_del.organization_id, 'deliverable', v_del.id, 'approved',
      coalesce(v_who, 'Client') || ' approved ' || v_del.title || ' (v' || new.version || ')', '{}'::jsonb, v_project.client_id, v_project.id, true);
    perform private.notify_project_team(v_project.id, 'deliverable_approved', 'Approved: ' || v_del.title,
      coalesce(v_who, 'Client') || ' approved v' || new.version, '/admin/projects/' || v_project.id || '?tab=deliverables',
      'deliverable', v_del.id, 'deliverable_review:' || new.id);
  else
    update public.deliverables set status = 'changes_requested', approved_at = null, approved_by = null where id = v_del.id;
    insert into public.revisions (organization_id, project_id, deliverable_id, review_id, requested_by, description)
    values (v_del.organization_id, v_project.id, v_del.id, new.id, new.reviewer_id,
            coalesce(nullif(new.feedback, ''), 'Changes requested on v' || new.version));
    perform private.log_activity(v_del.organization_id, 'deliverable', v_del.id, 'changes_requested',
      coalesce(v_who, 'Client') || ' requested changes to ' || v_del.title, jsonb_build_object('feedback', new.feedback),
      v_project.client_id, v_project.id, true);
    perform private.notify_project_team(v_project.id, 'revision_requested', 'Revision requested: ' || v_del.title,
      left(coalesce(new.feedback, ''), 200), '/admin/projects/' || v_project.id || '?tab=deliverables',
      'deliverable', v_del.id, 'deliverable_review:' || new.id);
  end if;
  return null;
end $$;
create trigger trg_deliverable_reviews_after after insert on public.deliverable_reviews
  for each row execute function private.on_deliverable_review();

-- ---------------------------------------------------------------------------
-- Proposals: send / accept / reject
-- ---------------------------------------------------------------------------
create or replace function private.before_proposal_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status = 'draft') then
    new.sent_at := coalesce(new.sent_at, now());
  end if;
  return new;
end $$;
create trigger trg_proposals_status_before before insert or update of status on public.proposals
  for each row execute function private.before_proposal_status();

create or replace function private.on_proposal_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return null; end if;
  perform private.log_activity(new.organization_id, 'proposal', new.id, new.status::text,
    'Proposal ' || new.number || ' ' || private.label(new.status::text), '{}'::jsonb, new.client_id, new.project_id, false);

  if new.status = 'sent' then
    if new.client_id is not null then
      perform private.notify_client_users(new.client_id, 'proposal_sent', 'New proposal: ' || new.title, new.number,
        '/portal/documents/proposals/' || new.id, 'proposal', new.id, 'proposal_sent:' || new.id);
      perform private.email_client_contacts(new.client_id, 'proposal_sent',
        jsonb_build_object('proposal_title', new.title, 'number', new.number, 'total_cents', new.total_cents, 'currency', new.currency,
                           'valid_until', new.valid_until, 'link', '/portal/documents/proposals/' || new.id),
        'proposal_sent:' || new.id);
    elsif new.lead_id is not null then
      update public.leads set status = 'proposal_sent' where id = new.lead_id and status in ('new','contacted','discovery','qualified');
    end if;
  elsif new.status in ('accepted','rejected') then
    perform private.notify_permission(new.organization_id, 'proposals.view', 'proposal_' || new.status::text,
      'Proposal ' || new.status::text || ': ' || new.title, new.number || coalesce(' · ' || left(new.client_response_note, 120), ''),
      '/admin/proposals/' || new.id, 'proposal', new.id, 'proposal_' || new.status::text || ':' || new.id);
    if new.lead_id is not null then
      update public.leads set status = case when new.status = 'accepted' then 'won'::public.lead_status else 'negotiation'::public.lead_status end
      where id = new.lead_id and status not in ('won','lost');
    end if;
  end if;
  return null;
end $$;
create trigger trg_proposals_status_after after insert or update of status on public.proposals
  for each row execute function private.on_proposal_status();

-- ---------------------------------------------------------------------------
-- 9-10. Invoices & payments
-- ---------------------------------------------------------------------------
create or replace function private.on_invoice_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return null; end if;
  perform private.log_activity(new.organization_id, 'invoice', new.id, new.status::text,
    'Invoice ' || new.number || ' ' || private.label(new.status::text), jsonb_build_object('total_cents', new.total_cents),
    new.client_id, new.project_id, new.status in ('sent','paid'));

  if new.status = 'sent' and (tg_op = 'INSERT' or old.status = 'draft') then
    perform private.notify_client_users(new.client_id, 'invoice_generated', 'New invoice ' || new.number, null,
      '/portal/invoices/' || new.id, 'invoice', new.id, 'invoice_sent:' || new.id);
    perform private.email_client_contacts(new.client_id, 'invoice_generated',
      jsonb_build_object('invoice_id', new.id, 'number', new.number, 'total_cents', new.total_cents, 'currency', new.currency,
                         'due_date', new.due_date, 'link', '/portal/invoices/' || new.id),
      'invoice_sent:' || new.id);
  elsif new.status = 'paid' then
    perform private.notify_permission(new.organization_id, 'finance.view', 'invoice_paid', 'Invoice ' || new.number || ' paid in full',
      null, '/admin/finance/invoices/' || new.id, 'invoice', new.id, 'invoice_paid:' || new.id);
    perform private.notify_client_users(new.client_id, 'invoice_paid', 'Invoice ' || new.number || ' is paid. Thank you!',
      null, '/portal/invoices/' || new.id, 'invoice', new.id, 'invoice_paid:' || new.id);
  elsif new.status = 'overdue' then
    perform private.notify_permission(new.organization_id, 'finance.view', 'invoice_overdue', 'Invoice ' || new.number || ' is overdue',
      null, '/admin/finance/invoices/' || new.id, 'invoice', new.id, 'invoice_overdue:' || new.id);
  end if;
  return null;
end $$;
create trigger trg_invoices_status_after after insert or update of status on public.invoices
  for each row execute function private.on_invoice_status();

create or replace function private.on_payment_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_inv public.invoices%rowtype;
begin
  if new.status <> 'completed' then return null; end if;
  select * into v_inv from public.invoices where id = new.invoice_id;
  perform private.log_activity(new.organization_id, 'payment', new.id, 'recorded',
    'Payment recorded against ' || v_inv.number, jsonb_build_object('amount_cents', new.amount_cents, 'method', new.method),
    new.client_id, new.project_id, false);
  perform private.notify_permission(new.organization_id, 'finance.view', 'payment_recorded', 'Payment recorded: ' || v_inv.number,
    null, '/admin/finance/invoices/' || v_inv.id, 'payment', new.id, 'payment_recorded:' || new.id, (select auth.uid()));
  return null;
end $$;
create trigger trg_payments_after_insert after insert on public.payments
  for each row execute function private.on_payment_insert();

-- ---------------------------------------------------------------------------
-- Messages, team invitations
-- ---------------------------------------------------------------------------
create or replace function private.before_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select organization_id into new.organization_id from public.conversations where id = new.conversation_id;
  return new;
end $$;
create trigger trg_messages_before_insert before insert on public.messages
  for each row execute function private.before_message_insert();

create or replace function private.on_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_conv public.conversations%rowtype; v_author text; v_is_team boolean; v_bucket text;
begin
  select * into v_conv from public.conversations where id = new.conversation_id;
  update public.conversations set last_message_at = new.created_at where id = v_conv.id;
  select coalesce(full_name, email) into v_author from public.profiles where id = new.author_id;
  v_is_team := exists (select 1 from public.team_members where organization_id = v_conv.organization_id and profile_id = new.author_id and status = 'active');
  v_bucket := to_char(date_trunc('hour', new.created_at), 'YYYYMMDDHH24');

  if v_is_team then
    if not v_conv.is_internal and v_conv.client_id is not null then
      perform private.notify_client_users(v_conv.client_id, 'message', 'New message from ' || coalesce(v_author, 'the team'),
        left(new.body, 140), '/portal/messages?c=' || v_conv.id, 'conversation', v_conv.id, 'msg:' || v_conv.id || ':' || v_bucket, new.author_id);
    end if;
    if v_conv.project_id is not null then
      perform private.notify_project_team(v_conv.project_id, 'message', coalesce(v_author, 'Teammate') || ' replied in ' || v_conv.subject,
        left(new.body, 140), '/admin/messages?c=' || v_conv.id, 'conversation', v_conv.id, 'msg:' || v_conv.id || ':' || v_bucket, new.author_id);
    end if;
  else
    -- client message: alert the project team, or the account manager / clients.manage holders
    if v_conv.project_id is not null then
      perform private.notify_project_team(v_conv.project_id, 'client_message', 'Client message: ' || coalesce(v_author, 'Client'),
        left(new.body, 140), '/admin/messages?c=' || v_conv.id, 'conversation', v_conv.id, 'msg:' || v_conv.id || ':' || v_bucket);
    else
      perform private.notify_permission(v_conv.organization_id, 'clients.manage', 'client_message', 'Client message: ' || coalesce(v_author, 'Client'),
        left(new.body, 140), '/admin/messages?c=' || v_conv.id, 'conversation', v_conv.id, 'msg:' || v_conv.id || ':' || v_bucket);
    end if;
  end if;
  return null;
end $$;
create trigger trg_messages_after_insert after insert on public.messages
  for each row execute function private.on_message_insert();

create or replace function private.on_team_member_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if old.status = 'invited' and new.status = 'active' then
    select coalesce(full_name, email) into v_name from public.profiles where id = new.profile_id;
    perform private.notify(new.invited_by, new.organization_id, 'team_invite_accepted', v_name || ' joined the team',
      private.label(new.role_key), '/admin/team', 'team_member', new.id, 'team_joined:' || new.id);
  end if;
  if new.role_key is distinct from old.role_key or new.status is distinct from old.status then
    perform private.log_activity(new.organization_id, 'team_member', new.id, 'updated',
      'Team member ' || coalesce((select full_name from public.profiles where id = new.profile_id), '') || ': '
        || private.label(new.role_key) || ' · ' || private.label(new.status::text),
      jsonb_build_object('role', new.role_key, 'status', new.status, 'previous_role', old.role_key, 'previous_status', old.status));
  end if;
  return null;
end $$;
create trigger trg_team_members_after_update after update on public.team_members
  for each row execute function private.on_team_member_update();

-- ---------------------------------------------------------------------------
-- Scheduled automations (run hourly by pg_cron; safe to run any time)
-- ---------------------------------------------------------------------------
create or replace function public.run_scheduled_automations()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record; v_followups int := 0; v_tasks int := 0; v_overdue int := 0; v_reminders int := 0; v_expired int := 0;
begin
  -- 3. Lead follow-up reminders
  for r in
    select l.* from public.leads l
    where l.deleted_at is null and l.follow_up_at is not null and l.follow_up_at <= now()
      and l.status not in ('won','lost','not_qualified')
  loop
    if r.assigned_to is not null then
      perform private.notify(r.assigned_to, r.organization_id, 'lead_follow_up', 'Follow up with ' || r.full_name,
        coalesce(r.company, ''), '/admin/leads/' || r.id, 'lead', r.id, 'lead_follow_up:' || r.id || ':' || extract(epoch from r.follow_up_at)::bigint);
    else
      perform private.notify_permission(r.organization_id, 'leads.manage', 'lead_follow_up', 'Follow up with ' || r.full_name,
        'Unassigned lead', '/admin/leads/' || r.id, 'lead', r.id, 'lead_follow_up:' || r.id || ':' || extract(epoch from r.follow_up_at)::bigint);
    end if;
    v_followups := v_followups + 1;
  end loop;

  -- Task deadline reminders (due within 24h or overdue, once per due date)
  for r in
    select t.*, p.name as project_name from public.tasks t join public.projects p on p.id = t.project_id
    where t.deleted_at is null and t.status <> 'done' and t.assignee_id is not null
      and t.due_date is not null and t.due_date <= current_date + 1
      and p.status not in ('completed','cancelled','on_hold')
  loop
    perform private.notify(r.assignee_id, r.organization_id, 'task_due',
      case when r.due_date < current_date then 'Overdue: ' else 'Due soon: ' end || r.title,
      r.project_name || ' · due ' || to_char(r.due_date, 'DD Mon'), '/admin/projects/' || r.project_id || '?task=' || r.id,
      'task', r.id, 'task_due:' || r.id || ':' || r.due_date);
    v_tasks := v_tasks + 1;
  end loop;

  -- Mark overdue invoices (status derivation keeps partial payments intact)
  with upd as (
    update public.invoices set status = 'overdue'
    where deleted_at is null and status in ('sent','partially_paid') and due_date < current_date
    returning id)
  select count(*) into v_overdue from upd;

  -- 9. Payment reminders: 3 days before due, 1 day after, 7 days after
  for r in
    select i.*, (current_date - i.due_date) as days_late from public.invoices i
    where i.deleted_at is null and i.status in ('sent','partially_paid','overdue') and i.balance_cents > 0
      and (i.due_date - current_date = 3 or current_date - i.due_date in (1, 7))
  loop
    perform private.email_client_contacts(r.client_id, 'payment_reminder',
      jsonb_build_object('invoice_id', r.id, 'number', r.number, 'balance_cents', r.balance_cents, 'currency', r.currency,
                         'due_date', r.due_date, 'days_late', r.days_late, 'link', '/portal/invoices/' || r.id),
      'payment_reminder:' || r.id || ':' || r.days_late);
    v_reminders := v_reminders + 1;
  end loop;

  -- Expire proposals and contracts
  with upd as (
    update public.proposals set status = 'expired'
    where deleted_at is null and status in ('sent','viewed') and valid_until is not null and valid_until < current_date
    returning id)
  select count(*) into v_expired from upd;

  update public.contracts set status = 'expired'
  where deleted_at is null and status in ('signed','active') and end_date is not null and end_date < current_date;

  for r in
    select c.* from public.contracts c
    where c.deleted_at is null and c.status in ('signed','active') and c.end_date between current_date and current_date + 30
  loop
    perform private.notify_permission(r.organization_id, 'contracts.view', 'contract_expiring', 'Contract expiring: ' || r.title,
      'Ends ' || to_char(r.end_date, 'DD Mon YYYY'), '/admin/contracts/' || r.id, 'contract', r.id, 'contract_expiring:' || r.id || ':' || r.end_date);
  end loop;

  -- Housekeeping
  delete from public.notifications where read_at is not null and read_at < now() - interval '180 days';
  update public.email_outbox set status = 'failed', locked_at = null, last_error = 'Dispatcher timeout'
    where status = 'sending' and locked_at < now() - interval '15 minutes';

  return jsonb_build_object('lead_followups', v_followups, 'task_reminders', v_tasks, 'invoices_marked_overdue', v_overdue,
                            'payment_reminders', v_reminders, 'proposals_expired', v_expired, 'ran_at', now());
end $$;
revoke execute on function public.run_scheduled_automations() from public, anon, authenticated;
grant execute on function public.run_scheduled_automations() to service_role;

-- ---------------------------------------------------------------------------
-- Email outbox dispatcher support (service role only)
-- ---------------------------------------------------------------------------
create or replace function public.claim_email_batch(p_limit int default 25)
returns setof public.email_outbox language plpgsql security definer set search_path = '' as $$
begin
  return query
  update public.email_outbox o set status = 'sending', locked_at = now(), attempts = o.attempts + 1
  where o.id in (
    select id from public.email_outbox
    where status in ('pending','failed') and next_attempt_at <= now() and attempts < max_attempts
    order by next_attempt_at
    limit p_limit
    for update skip locked)
  returning o.*;
end $$;

create or replace function public.complete_email(p_id uuid, p_ok boolean, p_provider text, p_message_id text, p_error text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_ok then
    update public.email_outbox set status = 'sent', sent_at = now(), locked_at = null, provider = p_provider,
      provider_message_id = p_message_id, last_error = null where id = p_id;
  else
    update public.email_outbox set
      status = case when attempts >= max_attempts then 'cancelled'::public.email_status else 'failed'::public.email_status end,
      locked_at = null, last_error = left(p_error, 2000), provider = p_provider,
      next_attempt_at = now() + make_interval(mins => (power(2, least(attempts, 8)))::int)
    where id = p_id;
  end if;
end $$;
revoke execute on function public.claim_email_batch(int), public.complete_email(uuid, boolean, text, text, text) from public, anon, authenticated;
grant execute on function public.claim_email_batch(int), public.complete_email(uuid, boolean, text, text, text) to service_role;

-- App configuration used by pg_cron -> HTTP dispatch (set once per environment, see docs/DEPLOYMENT.md)
create table private.app_config (
  key    text primary key,
  value  text not null
);

create or replace function private.dispatch_outbox_http()
returns void language plpgsql security definer set search_path = '' as $$
declare v_url text; v_secret text;
begin
  select value into v_url from private.app_config where key = 'app_url';
  select value into v_secret from private.app_config where key = 'cron_secret';
  if v_url is null or v_secret is null then return; end if;
  if not exists (select 1 from public.email_outbox where status in ('pending','failed') and next_attempt_at <= now() and attempts < max_attempts) then
    return;
  end if;
  perform net.http_post(url := v_url || '/api/cron/outbox',
                        headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
                        body := '{}'::jsonb);
end $$;

-- ---------------------------------------------------------------------------
-- Scheduling (pg_cron + pg_net). Guarded so local/CI environments without the
-- extensions still migrate cleanly.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    create extension if not exists pg_cron;
    create extension if not exists pg_net with schema extensions;
  exception when others then
    raise notice 'pg_cron/pg_net unavailable: %', sqlerrm;
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('agency-hourly-automations', '7 * * * *', 'select public.run_scheduled_automations()');
    if exists (select 1 from pg_extension where extname = 'pg_net') then
      perform cron.schedule('agency-email-dispatch', '*/5 * * * *', 'select private.dispatch_outbox_http()');
    end if;
  end if;
end $$;

-- Realtime for in-app notifications and messages
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications, public.messages;
  end if;
end $$;

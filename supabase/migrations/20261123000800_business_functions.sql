-- =============================================================================
-- TRANSACTIONAL BUSINESS OPERATIONS (SECURITY DEFINER with explicit checks)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Apply a project template: generates milestones + tasks with relative dates
-- ---------------------------------------------------------------------------
create or replace function public.apply_project_template(p_project uuid, p_template uuid, p_start date default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_project public.projects%rowtype; v_tpl public.project_templates%rowtype;
  v_start date; m record; t record; v_new_milestone uuid; v_count int := 0; v_assignee uuid;
begin
  select * into v_project from public.projects where id = p_project;
  if not found then raise exception 'Project not found'; end if;
  if not public.can_manage_project(p_project) and (select auth.uid()) is not null then
    raise exception 'Not allowed to manage this project' using errcode = 'insufficient_privilege';
  end if;
  select * into v_tpl from public.project_templates where id = p_template and organization_id = v_project.organization_id;
  if not found then raise exception 'Template not found'; end if;

  -- Idempotency: a template is applied at most once per project
  if exists (select 1 from public.activity_logs where entity_type = 'project' and entity_id = p_project
             and action = 'template_applied' and metadata->>'template_id' = p_template::text) then
    return 0;
  end if;

  v_start := coalesce(p_start, v_project.start_date, current_date);

  for m in select * from public.project_template_milestones where template_id = p_template order by sort_order loop
    insert into public.milestones (organization_id, project_id, title, description, start_date, due_date, sort_order, weight, is_client_visible)
    values (v_project.organization_id, p_project, m.title, m.description, v_start + m.offset_days,
            v_start + m.offset_days + m.duration_days, m.sort_order, m.weight, m.is_client_visible)
    returning id into v_new_milestone;

    for t in select * from public.project_template_tasks where template_id = p_template and milestone_id = m.id order by sort_order loop
      v_assignee := null;
      if t.default_role is not null then
        select pm.profile_id into v_assignee from public.project_members pm
          join public.team_members tm on tm.profile_id = pm.profile_id and tm.organization_id = v_project.organization_id
          where pm.project_id = p_project and tm.role_key = t.default_role and tm.status = 'active'
          order by pm.added_at limit 1;
      end if;
      insert into public.tasks (organization_id, project_id, milestone_id, title, description, due_date, start_date,
                                estimated_hours, sort_order, is_client_visible, requires_client_action, assignee_id, created_by)
      values (v_project.organization_id, p_project, v_new_milestone, t.title, t.description,
              v_start + m.offset_days + greatest(t.offset_days, 0), v_start + m.offset_days,
              t.estimated_hours, t.sort_order, t.is_client_visible, t.requires_client_action, v_assignee, (select auth.uid()));
      v_count := v_count + 1;
    end loop;
  end loop;

  -- tasks not attached to a template milestone
  for t in select * from public.project_template_tasks where template_id = p_template and milestone_id is null order by sort_order loop
    insert into public.tasks (organization_id, project_id, title, description, due_date, estimated_hours, sort_order,
                              is_client_visible, requires_client_action, created_by)
    values (v_project.organization_id, p_project, t.title, t.description, v_start + t.offset_days, t.estimated_hours,
            t.sort_order, t.is_client_visible, t.requires_client_action, (select auth.uid()));
    v_count := v_count + 1;
  end loop;

  update public.projects set template_id = p_template,
    due_date = coalesce(due_date, (select max(due_date) from public.milestones where project_id = p_project))
  where id = p_project;

  perform private.log_activity(v_project.organization_id, 'project', p_project, 'template_applied',
    'Template "' || v_tpl.name || '" applied (' || v_count || ' tasks generated)',
    jsonb_build_object('template_id', p_template, 'tasks', v_count), v_project.client_id, p_project, false);
  return v_count;
end $$;

-- ---------------------------------------------------------------------------
-- Convert a lead into a client (+ primary contact) and optionally a project
-- p_client: {"existing_client_id"?, "name"?, "type"?, "company_name"?, ...}
-- p_project: null | {"name", "service_id"?, "template_id"?, "start_date"?, "due_date"?, "budget_cents"?, "project_manager_id"?}
-- ---------------------------------------------------------------------------
create or replace function public.convert_lead(p_lead uuid, p_client jsonb default '{}'::jsonb, p_project jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_lead public.leads%rowtype; v_client uuid; v_project uuid; v_name text;
begin
  select * into v_lead from public.leads where id = p_lead and deleted_at is null for update;
  if not found then raise exception 'Lead not found'; end if;
  if not (public.has_permission(v_lead.organization_id, 'leads.manage') and public.has_permission(v_lead.organization_id, 'clients.manage')) then
    raise exception 'You need lead and client management permissions to convert leads.' using errcode = 'insufficient_privilege';
  end if;
  if v_lead.converted_client_id is not null then
    return jsonb_build_object('client_id', v_lead.converted_client_id, 'project_id', null, 'already_converted', true);
  end if;

  if nullif(p_client->>'existing_client_id', '') is not null then
    select id into v_client from public.clients
      where id = (p_client->>'existing_client_id')::uuid and organization_id = v_lead.organization_id and deleted_at is null;
    if v_client is null then raise exception 'Existing client not found'; end if;
  else
    v_name := coalesce(nullif(p_client->>'name', ''), nullif(v_lead.company, ''), v_lead.full_name);
    insert into public.clients (organization_id, type, name, company_name, email, phone, website, industry, country, source,
                                account_manager_id, notes, converted_from_lead_id, created_by)
    values (v_lead.organization_id,
            coalesce(nullif(p_client->>'type', '')::public.client_type, case when nullif(v_lead.company, '') is null then 'individual' else 'company' end::public.client_type),
            v_name, coalesce(nullif(p_client->>'company_name', ''), v_lead.company),
            coalesce(nullif(p_client->>'email', ''), v_lead.email::text), coalesce(nullif(p_client->>'phone', ''), v_lead.phone),
            coalesce(nullif(p_client->>'website', ''), v_lead.website), coalesce(nullif(p_client->>'industry', ''), v_lead.industry),
            coalesce(nullif(p_client->>'country', ''), v_lead.country), v_lead.source,
            coalesce(nullif(p_client->>'account_manager_id', '')::uuid, v_lead.assigned_to, (select auth.uid())),
            v_lead.description, v_lead.id, (select auth.uid()))
    returning id into v_client;
  end if;

  insert into public.client_contacts (organization_id, client_id, full_name, email, phone, is_primary)
  values (v_lead.organization_id, v_client, v_lead.full_name, v_lead.email, v_lead.phone,
          not exists (select 1 from public.client_contacts where client_id = v_client and is_primary and deleted_at is null))
  on conflict (client_id, email) do nothing;

  update public.leads set status = 'won', converted_client_id = v_client, converted_at = now(), follow_up_at = null where id = v_lead.id;
  update public.proposals set client_id = v_client where lead_id = v_lead.id and client_id is null;

  insert into public.lead_activities (organization_id, lead_id, actor_id, type, description, metadata)
  values (v_lead.organization_id, v_lead.id, (select auth.uid()), 'converted', 'Converted to client', jsonb_build_object('client_id', v_client));
  perform private.log_activity(v_lead.organization_id, 'client', v_client, 'created_from_lead',
    'Client created from lead ' || v_lead.full_name, jsonb_build_object('lead_id', v_lead.id), v_client, null, false);

  if p_project is not null and nullif(p_project->>'name', '') is not null then
    if not public.has_permission(v_lead.organization_id, 'projects.manage') then
      raise exception 'You need project management permission to create the project.' using errcode = 'insufficient_privilege';
    end if;
    insert into public.projects (organization_id, code, name, client_id, service_id, lead_id, description, start_date, due_date,
                                 budget_cents, project_manager_id, status, created_by)
    values (v_lead.organization_id, '', p_project->>'name', v_client,
            coalesce(nullif(p_project->>'service_id', '')::uuid, v_lead.service_id), v_lead.id,
            coalesce(nullif(p_project->>'description', ''), v_lead.description),
            nullif(p_project->>'start_date', '')::date, nullif(p_project->>'due_date', '')::date,
            coalesce(nullif(p_project->>'budget_cents', '')::bigint, v_lead.budget_cents),
            coalesce(nullif(p_project->>'project_manager_id', '')::uuid, (select auth.uid())), 'planning', (select auth.uid()))
    returning id into v_project;
    if nullif(p_project->>'template_id', '') is not null then
      perform public.apply_project_template(v_project, (p_project->>'template_id')::uuid, nullif(p_project->>'start_date', '')::date);
    end if;
  end if;

  return jsonb_build_object('client_id', v_client, 'project_id', v_project, 'already_converted', false);
end $$;

-- ---------------------------------------------------------------------------
-- Accepted proposal -> project (+ draft contract with recorded acceptance)
-- ---------------------------------------------------------------------------
create or replace function public.create_project_from_proposal(p_proposal uuid, p_template uuid default null, p_options jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_prop public.proposals%rowtype; v_project uuid; v_contract uuid; v_service uuid;
begin
  select * into v_prop from public.proposals where id = p_proposal and deleted_at is null for update;
  if not found then raise exception 'Proposal not found'; end if;
  if not (public.has_permission(v_prop.organization_id, 'proposals.manage') and public.has_permission(v_prop.organization_id, 'projects.manage')) then
    raise exception 'You need proposal and project management permissions.' using errcode = 'insufficient_privilege';
  end if;
  if v_prop.status <> 'accepted' then raise exception 'Only accepted proposals can be converted into projects.'; end if;
  if v_prop.client_id is null then raise exception 'Convert the lead into a client before creating the project.'; end if;
  if v_prop.project_id is not null then
    return jsonb_build_object('project_id', v_prop.project_id, 'already_created', true);
  end if;

  select service_id into v_service from public.proposal_items where proposal_id = v_prop.id and service_id is not null order by sort_order limit 1;

  insert into public.projects (organization_id, code, name, client_id, service_id, proposal_id, lead_id, description, scope,
                               contract_value_cents, budget_cents, start_date, due_date, project_manager_id, status, created_by)
  values (v_prop.organization_id, '', coalesce(nullif(p_options->>'name', ''), v_prop.title), v_prop.client_id, v_service, v_prop.id,
          v_prop.lead_id, v_prop.summary, v_prop.scope, v_prop.total_cents, v_prop.total_cents,
          coalesce(nullif(p_options->>'start_date', '')::date, current_date), nullif(p_options->>'due_date', '')::date,
          coalesce(nullif(p_options->>'project_manager_id', '')::uuid, (select auth.uid())), 'planning', (select auth.uid()))
  returning id into v_project;

  update public.proposals set project_id = v_project where id = v_prop.id;

  if coalesce((p_options->>'create_contract')::boolean, true) then
    insert into public.contracts (organization_id, client_id, project_id, proposal_id, title, status, value_cents, start_date,
                                  accepted_at, accepted_by, notes, created_by)
    values (v_prop.organization_id, v_prop.client_id, v_project, v_prop.id, 'Agreement: ' || v_prop.title, 'draft',
            v_prop.total_cents, coalesce(nullif(p_options->>'start_date', '')::date, current_date),
            v_prop.responded_at, v_prop.responded_by,
            'Generated from proposal ' || v_prop.number || '. Client acceptance recorded on ' || coalesce(to_char(v_prop.responded_at, 'DD Mon YYYY'), 'n/a')
              || '. Upload the signed agreement to complete.', (select auth.uid()))
    returning id into v_contract;
  end if;

  if p_template is not null then
    perform public.apply_project_template(v_project, p_template, nullif(p_options->>'start_date', '')::date);
  end if;

  return jsonb_build_object('project_id', v_project, 'contract_id', v_contract, 'already_created', false);
end $$;

-- ---------------------------------------------------------------------------
-- Proposal -> invoice (full or deposit percentage). Created as draft.
-- ---------------------------------------------------------------------------
create or replace function public.create_invoice_from_proposal(p_proposal uuid, p_percent int default 100, p_due_days int default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_prop public.proposals%rowtype; v_inv uuid; v_terms int; v_net bigint;
begin
  select * into v_prop from public.proposals where id = p_proposal and deleted_at is null;
  if not found then raise exception 'Proposal not found'; end if;
  if not public.has_permission(v_prop.organization_id, 'finance.manage') then
    raise exception 'You need finance permissions to create invoices.' using errcode = 'insufficient_privilege';
  end if;
  if v_prop.client_id is null then raise exception 'The proposal must belong to a client.'; end if;
  if p_percent < 1 or p_percent > 100 then raise exception 'Percent must be between 1 and 100'; end if;
  select default_payment_terms_days into v_terms from public.settings where organization_id = v_prop.organization_id;

  insert into public.invoices (organization_id, number, client_id, project_id, proposal_id, issue_date, due_date, status,
                               discount_type, discount_value, tax_rate_bps, payment_terms, created_by)
  values (v_prop.organization_id, '', v_prop.client_id, v_prop.project_id, v_prop.id, current_date,
          current_date + coalesce(p_due_days, v_terms, 14), 'draft',
          case when p_percent = 100 then v_prop.discount_type else 'none' end,
          case when p_percent = 100 then v_prop.discount_value else 0 end,
          v_prop.tax_rate_bps, v_prop.payment_terms, (select auth.uid()))
  returning id into v_inv;

  if p_percent = 100 then
    insert into public.invoice_items (invoice_id, service_id, description, quantity, unit_price_cents, sort_order)
    select v_inv, service_id, description, quantity, unit_price_cents, sort_order from public.proposal_items where proposal_id = v_prop.id;
  else
    v_net := v_prop.subtotal_cents - v_prop.discount_cents;
    insert into public.invoice_items (invoice_id, description, quantity, unit_price_cents, sort_order)
    values (v_inv, p_percent || '% payment for ' || v_prop.title || ' (' || v_prop.number || ')', 1,
            round(v_net::numeric * p_percent / 100)::bigint, 0);
  end if;
  return v_inv;
end $$;

-- ---------------------------------------------------------------------------
-- First-run setup: create the agency organization with sensible defaults.
-- Only callable when no organization exists yet.
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_organization(p_owner uuid, p_name text, p_slug text, p_currency text default 'USD', p_timezone text default 'UTC')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_tpl uuid;
begin
  if exists (select 1 from public.organizations) then
    raise exception 'The agency has already been set up.';
  end if;
  insert into public.organizations (name, slug) values (p_name, p_slug) returning id into v_org;
  insert into public.settings (organization_id, currency, timezone, company_legal_name, payment_instructions)
  values (v_org, upper(p_currency), p_timezone, p_name,
          'Bank transfer details will be provided here. Please include the invoice number as the payment reference.');
  insert into public.team_members (organization_id, profile_id, role_key, status, joined_at, title)
  values (v_org, p_owner, 'owner', 'active', now(), 'Founder');

  insert into public.services (organization_id, slug, name, category, icon, summary, description, delivery_time, deliverables, sort_order) values
  (v_org,'website-development','Website Development','Engineering','globe','High-performance marketing sites that convert.',
   'Fast, accessible and SEO-ready websites built on a modern stack, with a CMS your team can actually use.','4–8 weeks',
   array['Responsive website','CMS setup','SEO foundation','Analytics','Launch support'],1),
  (v_org,'web-applications','Web Application Development','Engineering','app-window','Custom platforms, portals and SaaS products.',
   'From internal tools to customer-facing platforms: secure, scalable applications engineered for the long run.','8–16 weeks',
   array['Product specification','Application','Admin panel','Automated tests','Deployment'],2),
  (v_org,'ui-ux-design','UI/UX Design','Design','pen-tool','Research-led interfaces people enjoy using.',
   'User research, information architecture, wireframes, prototypes and design systems.','3–6 weeks',
   array['User flows','Wireframes','High-fidelity UI','Interactive prototype','Design system'],3),
  (v_org,'branding','Branding & Creative','Design','sparkles','Identities with clarity and character.',
   'Brand strategy, identity systems, guidelines and launch assets.','3–5 weeks',
   array['Brand strategy','Logo suite','Typography & colour','Brand guidelines','Asset kit'],4),
  (v_org,'business-intelligence','Business Intelligence & Analytics','Data','bar-chart-3','Turn raw data into decisions.',
   'Data modelling, pipelines and analytics that give leadership a single source of truth.','4–8 weeks',
   array['Data audit','Data model','KPI framework','Dashboards','Training'],5),
  (v_org,'power-bi','Power BI Dashboards & Reporting','Data','pie-chart','Executive-grade Power BI reporting.',
   'Interactive Power BI dashboards with governed datasets, row-level security and automated refresh.','2–6 weeks',
   array['Requirements workshop','Semantic model','Dashboards','Automated refresh','Handover'],6),
  (v_org,'ai-solutions','AI-Powered Business Solutions','AI','brain-circuit','Practical AI that saves real hours.',
   'Assistants, document intelligence and AI features integrated into your existing workflows.','4–10 weeks',
   array['Use-case discovery','Prototype','Production integration','Evaluation','Monitoring'],7),
  (v_org,'automation-integrations','Workflow Automation & Integrations','Engineering','workflow','Connect your tools, remove busywork.',
   'APIs, integrations and automated workflows between the systems you already use.','2–6 weeks',
   array['Process mapping','Integrations','Automations','Error handling','Documentation'],8),
  (v_org,'custom-software','Custom Software Development','Engineering','code-2','Software shaped around your business.',
   'Bespoke systems for operations, logistics, finance and beyond.','Scoped per project',
   array['Discovery','Architecture','Development','QA','Support'],9);

  insert into public.project_templates (organization_id, name, description, service_id)
  values (v_org, 'Website Development', 'Standard delivery plan for marketing websites.',
          (select id from public.services where organization_id = v_org and slug = 'website-development'))
  returning id into v_tpl;
  insert into public.project_template_milestones (template_id, title, sort_order, offset_days, duration_days, weight) values
    (v_tpl,'Discovery & requirements',1,0,5,1),(v_tpl,'Research',2,5,4,1),(v_tpl,'Wireframing',3,9,5,1),
    (v_tpl,'UI/UX design',4,14,10,2),(v_tpl,'Development',5,24,15,3),(v_tpl,'Content integration',6,39,4,1),
    (v_tpl,'Testing',7,43,4,1),(v_tpl,'Client review',8,47,4,1),(v_tpl,'Revisions',9,51,4,1),
    (v_tpl,'Deployment',10,55,2,1),(v_tpl,'Final delivery',11,57,2,1);
  insert into public.project_template_tasks (template_id, milestone_id, title, sort_order, offset_days, estimated_hours, is_client_visible, requires_client_action, default_role)
  select v_tpl, m.id, x.title, x.ord, x.off, x.hrs, x.vis, x.act, x.role
  from public.project_template_milestones m
  join (values
    ('Discovery & requirements','Kickoff meeting',1,0,2::numeric,true,true,null),
    ('Discovery & requirements','Requirements document',2,2,6,true,false,'project_manager'),
    ('Discovery & requirements','Client to share brand assets & content',3,2,0,true,true,null),
    ('Research','Competitor & audience research',1,0,8,false,false,'designer'),
    ('Wireframing','Sitemap & wireframes',1,0,12,true,false,'designer'),
    ('UI/UX design','Homepage design',1,0,16,true,false,'designer'),
    ('UI/UX design','Inner page designs',2,5,20,true,false,'designer'),
    ('UI/UX design','Design approval',3,9,1,true,true,null),
    ('Development','Project setup & CI',1,0,4,false,false,'developer'),
    ('Development','Build pages & components',2,1,48,false,false,'developer'),
    ('Development','CMS integration',3,8,12,false,false,'developer'),
    ('Content integration','Populate content',1,0,8,false,false,'developer'),
    ('Testing','Cross-browser & accessibility QA',1,0,8,false,false,'developer'),
    ('Client review','Client review of staging site',1,0,2,true,true,null),
    ('Revisions','Implement feedback',1,0,10,false,false,'developer'),
    ('Deployment','Production deployment',1,0,3,true,false,'developer'),
    ('Final delivery','Handover & training',1,0,2,true,false,'project_manager')
  ) as x(ms, title, ord, off, hrs, vis, act, role) on x.ms = m.title
  where m.template_id = v_tpl;

  insert into public.project_templates (organization_id, name, description, service_id)
  values (v_org, 'Power BI Dashboard', 'Requirements to production for Power BI reporting.',
          (select id from public.services where organization_id = v_org and slug = 'power-bi'))
  returning id into v_tpl;
  insert into public.project_template_milestones (template_id, title, sort_order, offset_days, duration_days, weight) values
    (v_tpl,'Requirements workshop',1,0,3,1),(v_tpl,'Data model',2,3,7,2),(v_tpl,'Dashboard build',3,10,10,3),
    (v_tpl,'UAT & refinements',4,20,5,1),(v_tpl,'Deployment & training',5,25,3,1);

  insert into public.project_templates (organization_id, name, description, service_id)
  values (v_org, 'Brand Identity', 'Strategy, identity and guidelines.',
          (select id from public.services where organization_id = v_org and slug = 'branding'))
  returning id into v_tpl;
  insert into public.project_template_milestones (template_id, title, sort_order, offset_days, duration_days, weight) values
    (v_tpl,'Brand strategy',1,0,5,1),(v_tpl,'Concepts',2,5,7,2),(v_tpl,'Refinement',3,12,5,1),(v_tpl,'Guidelines & assets',4,17,5,1);

  insert into public.faqs (organization_id, question, answer, sort_order) values
  (v_org,'How do projects usually start?','With a free discovery call. We learn about your goals, constraints and timeline, then send a clear proposal with scope, milestones and pricing.',1),
  (v_org,'How long does a typical project take?','Most websites take 4–8 weeks and most applications 8–16 weeks. Your proposal includes a milestone-by-milestone timeline.',2),
  (v_org,'How does payment work?','We usually work with a deposit to begin and the balance tied to milestones. All invoices are available in your client portal.',3),
  (v_org,'Will I be able to track progress?','Yes. Every client gets a private portal with live project progress, deliverables, approvals, invoices and direct messaging.',4),
  (v_org,'Do you offer support after launch?','Yes. We offer maintenance and support plans, and every project includes a post-launch support window.',5),
  (v_org,'Who owns the work?','You do. Once the final invoice is paid, all agreed deliverables and source code are yours.',6);

  return v_org;
end $$;
revoke execute on function public.bootstrap_organization(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.bootstrap_organization(uuid, text, text, text, text) to service_role;

grant execute on function public.apply_project_template(uuid, uuid, date), public.convert_lead(uuid, jsonb, jsonb),
  public.create_project_from_proposal(uuid, uuid, jsonb), public.create_invoice_from_proposal(uuid, int, int) to authenticated;
revoke execute on function public.apply_project_template(uuid, uuid, date), public.convert_lead(uuid, jsonb, jsonb),
  public.create_project_from_proposal(uuid, uuid, jsonb), public.create_invoice_from_proposal(uuid, int, int) from anon, public;

-- =============================================================================
-- CLIENT PORTAL
-- Clients never read base tables directly (except messages/notifications).
-- These views run with the owner's privileges and filter by auth.uid(), exposing
-- only client-safe columns (no internal notes, budgets, costs or internal tasks).
-- Writes happen only through the portal_* SECURITY DEFINER functions below.
-- =============================================================================

create view public.portal_clients with (security_barrier) as
select c.id, c.organization_id, c.type, c.name, c.company_name, c.email, c.phone, c.website, c.industry,
       c.address_line1, c.address_line2, c.city, c.state, c.postal_code, c.country, c.tax_id, c.status, c.created_at
from public.clients c
where c.deleted_at is null and c.id in (select public.my_client_ids());

create view public.portal_agency with (security_barrier) as
select o.id as organization_id, o.name, s.currency, s.timezone, s.payment_instructions, s.company_legal_name,
       s.company_address, s.company_email, s.company_phone, s.tax_id
from public.organizations o
join public.settings s on s.organization_id = o.id
where o.id in (select c.organization_id from public.clients c where c.id in (select public.my_client_ids()));

create view public.portal_projects with (security_barrier) as
select p.id, p.organization_id, p.code, p.name, p.client_id, s.name as service_name, p.description, p.scope,
       p.start_date, p.due_date, p.completed_at, p.status, p.progress, p.priority,
       p.project_manager_id, pm.full_name as project_manager_name, pm.email as project_manager_email,
       pm.avatar_url as project_manager_avatar, p.created_at, p.updated_at
from public.projects p
left join public.services s on s.id = p.service_id
left join public.profiles pm on pm.id = p.project_manager_id
where p.deleted_at is null and p.status <> 'draft' and p.client_id in (select public.my_client_ids());

create view public.portal_milestones with (security_barrier) as
select m.id, m.project_id, m.title, m.description, m.status, m.start_date, m.due_date, m.completed_at, m.sort_order
from public.milestones m
where m.is_client_visible and m.project_id in (select id from public.portal_projects);

create view public.portal_tasks with (security_barrier) as
select t.id, t.project_id, t.milestone_id, t.title, t.description, t.status, t.priority, t.due_date, t.completed_at,
       t.requires_client_action, t.sort_order
from public.tasks t
where t.is_client_visible and t.deleted_at is null and t.parent_task_id is null
  and t.project_id in (select id from public.portal_projects);

create view public.portal_deliverables with (security_barrier) as
select d.id, d.project_id, d.milestone_id, d.title, d.description, d.status, d.current_version, d.due_date,
       d.submitted_at, d.approved_at, d.created_at, d.updated_at
from public.deliverables d
where d.status <> 'draft' and d.project_id in (select id from public.portal_projects);

create view public.portal_deliverable_versions with (security_barrier) as
select v.id, v.deliverable_id, v.version, v.file_id, f.name as file_name, f.mime_type, f.size_bytes, v.external_url,
       v.notes, v.created_at
from public.deliverable_versions v
left join public.files f on f.id = v.file_id and f.deleted_at is null
where v.deliverable_id in (select id from public.portal_deliverables);

create view public.portal_deliverable_reviews with (security_barrier) as
select r.id, r.deliverable_id, r.version, r.decision, r.feedback, r.created_at, p.full_name as reviewer_name
from public.deliverable_reviews r
left join public.profiles p on p.id = r.reviewer_id
where r.deliverable_id in (select id from public.portal_deliverables);

create view public.portal_revisions with (security_barrier) as
select r.id, r.project_id, r.deliverable_id, r.description, r.status, r.resolved_at, r.created_at
from public.revisions r
where r.project_id in (select id from public.portal_projects);

create view public.portal_files with (security_barrier) as
select f.id, f.organization_id, f.name, f.mime_type, f.size_bytes, f.category, f.project_id, f.client_id, f.created_at,
       p.full_name as uploaded_by_name, f.uploaded_by
from public.files f
left join public.profiles p on p.id = f.uploaded_by
where f.deleted_at is null and f.visibility = 'client'
  and ((f.project_id is not null and f.project_id in (select id from public.portal_projects))
       or (f.project_id is null and f.client_id in (select public.my_client_ids())));

create view public.portal_invoices with (security_barrier) as
select i.id, i.organization_id, i.number, i.client_id, i.project_id, i.issue_date, i.due_date, i.status, i.currency,
       i.subtotal_cents, i.discount_type, i.discount_value, i.discount_cents, i.tax_rate_bps, i.tax_cents, i.total_cents,
       i.amount_paid_cents, i.balance_cents, i.payment_terms, i.notes, i.sent_at, i.paid_at, i.created_at
from public.invoices i
where i.deleted_at is null and i.status <> 'draft' and i.client_id in (select public.my_client_ids());

create view public.portal_invoice_items with (security_barrier) as
select it.id, it.invoice_id, it.description, it.quantity, it.unit_price_cents, it.amount_cents, it.sort_order
from public.invoice_items it where it.invoice_id in (select id from public.portal_invoices);

create view public.portal_payments with (security_barrier) as
select pay.id, pay.invoice_id, pay.amount_cents, pay.payment_date, pay.method, pay.reference, pay.status, pay.created_at
from public.payments pay
where pay.status in ('completed','refunded') and pay.invoice_id in (select id from public.portal_invoices);

create view public.portal_proposals with (security_barrier) as
select pr.id, pr.organization_id, pr.number, pr.client_id, pr.title, pr.summary, pr.scope, pr.timeline, pr.payment_terms,
       pr.valid_until, pr.status, pr.currency, pr.subtotal_cents, pr.discount_type, pr.discount_value, pr.discount_cents,
       pr.tax_rate_bps, pr.tax_cents, pr.total_cents, pr.sent_at, pr.viewed_at, pr.responded_at, pr.client_response_note, pr.created_at
from public.proposals pr
where pr.deleted_at is null and pr.status <> 'draft' and pr.client_id in (select public.my_client_ids());

create view public.portal_proposal_items with (security_barrier) as
select it.id, it.proposal_id, it.description, it.details, it.quantity, it.unit_price_cents, it.amount_cents, it.sort_order
from public.proposal_items it where it.proposal_id in (select id from public.portal_proposals);

create view public.portal_contracts with (security_barrier) as
select c.id, c.client_id, c.project_id, c.title, c.description, c.status, c.value_cents, c.start_date, c.end_date,
       c.signed_at, c.accepted_at, c.current_version, c.created_at,
       (select v.file_id from public.contract_versions v where v.contract_id = c.id order by v.version desc limit 1) as latest_file_id
from public.contracts c
where c.deleted_at is null and c.status <> 'draft' and c.client_id in (select public.my_client_ids());

create view public.portal_activity with (security_barrier) as
select a.id, a.entity_type, a.entity_id, a.action, a.description, a.project_id, a.client_id, a.created_at
from public.activity_logs a
where a.is_client_visible and a.client_id in (select public.my_client_ids())
  and (a.project_id is null or a.project_id in (select id from public.portal_projects));

create view public.portal_my_contact with (security_barrier) as
select cc.id, cc.client_id, cc.full_name, cc.email, cc.phone, cc.job_title, cc.is_primary
from public.client_contacts cc
where cc.profile_id = (select auth.uid()) and cc.deleted_at is null and cc.portal_access;

-- Lock views down: read-only, authenticated only
do $$
declare v text;
begin
  for v in select viewname from pg_views where schemaname = 'public' and viewname like 'portal\_%' loop
    execute format('revoke all on public.%I from public, anon, authenticated', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Portal actions
-- ---------------------------------------------------------------------------
create or replace function public.portal_review_deliverable(p_deliverable uuid, p_decision public.review_decision, p_feedback text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_del public.deliverables%rowtype;
begin
  select * into v_del from public.deliverables where id = p_deliverable for update;
  if not found or not public.client_can_view_project(v_del.project_id) then
    raise exception 'Deliverable not found' using errcode = 'no_data_found';
  end if;
  if v_del.status <> 'submitted' then
    raise exception 'This deliverable is not awaiting your review.' using errcode = 'check_violation';
  end if;
  if p_decision = 'changes_requested' and coalesce(btrim(p_feedback), '') = '' then
    raise exception 'Please describe the changes you would like.' using errcode = 'check_violation';
  end if;
  insert into public.deliverable_reviews (deliverable_id, version, reviewer_id, decision, feedback)
  values (v_del.id, v_del.current_version, (select auth.uid()), p_decision, nullif(btrim(p_feedback), ''));
end $$;

create or replace function public.portal_respond_proposal(p_proposal uuid, p_decision text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_prop public.proposals%rowtype;
begin
  select * into v_prop from public.proposals where id = p_proposal and deleted_at is null for update;
  if not found or v_prop.client_id is null or not public.is_client_user(v_prop.client_id) then
    raise exception 'Proposal not found' using errcode = 'no_data_found';
  end if;
  if p_decision not in ('accepted','rejected') then raise exception 'Invalid decision'; end if;
  if v_prop.status not in ('sent','viewed') then
    raise exception 'This proposal can no longer be responded to (status: %).', v_prop.status using errcode = 'check_violation';
  end if;
  if v_prop.valid_until is not null and v_prop.valid_until < current_date then
    update public.proposals set status = 'expired' where id = v_prop.id;
    raise exception 'This proposal has expired. Please contact us for an updated proposal.' using errcode = 'check_violation';
  end if;
  update public.proposals set status = p_decision::public.proposal_status, responded_at = now(),
    responded_by = (select auth.uid()), client_response_note = nullif(btrim(p_note), ''),
    viewed_at = coalesce(viewed_at, now())
  where id = v_prop.id;
end $$;

create or replace function public.portal_mark_proposal_viewed(p_proposal uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.proposals set status = 'viewed', viewed_at = now()
  where id = p_proposal and status = 'sent' and client_id is not null and public.is_client_user(client_id);
end $$;

create or replace function public.portal_accept_contract(p_contract uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_c public.contracts%rowtype;
begin
  select * into v_c from public.contracts where id = p_contract and deleted_at is null for update;
  if not found or not public.is_client_user(v_c.client_id) then raise exception 'Contract not found' using errcode = 'no_data_found'; end if;
  if v_c.status <> 'sent' then raise exception 'This contract is not awaiting acceptance.' using errcode = 'check_violation'; end if;
  if v_c.accepted_at is not null then return; end if;
  update public.contracts set accepted_at = now(), accepted_by = (select auth.uid()) where id = v_c.id;
  perform private.log_activity(v_c.organization_id, 'contract', v_c.id, 'accepted', 'Client accepted contract: ' || v_c.title,
    '{}'::jsonb, v_c.client_id, v_c.project_id, true);
  perform private.notify_permission(v_c.organization_id, 'contracts.view', 'contract_accepted', 'Contract accepted: ' || v_c.title,
    null, '/admin/contracts/' || v_c.id, 'contract', v_c.id, 'contract_accepted:' || v_c.id);
end $$;

create or replace function public.portal_update_my_contact(p_full_name text, p_phone text, p_job_title text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(btrim(p_full_name), '') = '' then raise exception 'Name is required'; end if;
  update public.client_contacts set full_name = btrim(p_full_name), phone = nullif(btrim(p_phone), ''), job_title = nullif(btrim(p_job_title), '')
  where profile_id = (select auth.uid()) and deleted_at is null;
  update public.profiles set full_name = btrim(p_full_name), phone = nullif(btrim(p_phone), ''), job_title = nullif(btrim(p_job_title), '')
  where id = (select auth.uid());
end $$;

create or replace function public.portal_touch()
returns void language sql security definer set search_path = '' as $$
  update public.client_contacts set last_seen_at = now() where profile_id = (select auth.uid()) and deleted_at is null;
$$;

grant execute on function public.portal_review_deliverable(uuid, public.review_decision, text), public.portal_respond_proposal(uuid, text, text),
  public.portal_mark_proposal_viewed(uuid), public.portal_accept_contract(uuid), public.portal_update_my_contact(text, text, text),
  public.portal_touch() to authenticated;
revoke execute on function public.portal_review_deliverable(uuid, public.review_decision, text), public.portal_respond_proposal(uuid, text, text),
  public.portal_mark_proposal_viewed(uuid), public.portal_accept_contract(uuid), public.portal_update_my_contact(text, text, text),
  public.portal_touch() from anon, public;

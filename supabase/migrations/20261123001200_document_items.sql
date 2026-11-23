-- =============================================================================
-- Atomic line-item replacement for proposals and invoices (SECURITY INVOKER:
-- RLS and the locking triggers still apply). Amounts are recomputed by triggers;
-- any client-supplied amount is ignored.
-- =============================================================================
create or replace function public.replace_document_items(p_kind text, p_id uuid, p_items jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_item jsonb; v_i int := 0;
begin
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Items must be an array'; end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'Too many line items'; end if;
  if p_kind = 'invoice' then
    if not exists (select 1 from public.invoices where id = p_id) then raise exception 'Invoice not found'; end if;
    delete from public.invoice_items where invoice_id = p_id;
    for v_item in select * from jsonb_array_elements(p_items) loop
      v_i := v_i + 1;
      insert into public.invoice_items (invoice_id, service_id, description, quantity, unit_price_cents, sort_order)
      values (p_id, nullif(v_item->>'service_id', '')::uuid, v_item->>'description', (v_item->>'quantity')::numeric,
              (v_item->>'unit_price_cents')::bigint, v_i);
    end loop;
  elsif p_kind = 'proposal' then
    if not exists (select 1 from public.proposals where id = p_id) then raise exception 'Proposal not found'; end if;
    delete from public.proposal_items where proposal_id = p_id;
    for v_item in select * from jsonb_array_elements(p_items) loop
      v_i := v_i + 1;
      insert into public.proposal_items (proposal_id, service_id, description, details, quantity, unit_price_cents, sort_order)
      values (p_id, nullif(v_item->>'service_id', '')::uuid, v_item->>'description', nullif(v_item->>'details', ''),
              (v_item->>'quantity')::numeric, (v_item->>'unit_price_cents')::bigint, v_i);
    end loop;
  else
    raise exception 'Unknown document kind';
  end if;
end $$;
grant execute on function public.replace_document_items(text, uuid, jsonb) to authenticated;
revoke execute on function public.replace_document_items(text, uuid, jsonb) from anon, public;

-- convert_lead gains p_mark_won (false when a client record is needed before the deal is won,
-- e.g. to give a lead portal access to review a proposal).
drop function if exists public.convert_lead(uuid, jsonb, jsonb);
create or replace function public.convert_lead(p_lead uuid, p_client jsonb default '{}'::jsonb, p_project jsonb default null, p_mark_won boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_lead public.leads%rowtype; v_client uuid; v_project uuid; v_name text;
begin
  select * into v_lead from public.leads where id = p_lead and deleted_at is null for update;
  if not found then raise exception 'Lead not found'; end if;
  if not (public.has_permission(v_lead.organization_id, 'leads.manage') and public.has_permission(v_lead.organization_id, 'clients.manage')) then
    raise exception 'You need lead and client management permissions to convert leads.' using errcode = 'insufficient_privilege';
  end if;
  if v_lead.converted_client_id is not null then
    if p_mark_won then update public.leads set status = 'won' where id = v_lead.id and status <> 'won'; end if;
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

  update public.leads set converted_client_id = v_client, converted_at = now(),
    status = case when p_mark_won then 'won'::public.lead_status else status end,
    follow_up_at = case when p_mark_won then null else follow_up_at end
  where id = v_lead.id;
  update public.proposals set client_id = v_client where lead_id = v_lead.id and client_id is null;

  insert into public.lead_activities (organization_id, lead_id, actor_id, type, description, metadata)
  values (v_lead.organization_id, v_lead.id, (select auth.uid()), 'converted',
          case when p_mark_won then 'Converted to client' else 'Client record created' end, jsonb_build_object('client_id', v_client));
  perform private.log_activity(v_lead.organization_id, 'client', v_client, 'created_from_lead',
    'Client created from lead ' || v_lead.full_name, jsonb_build_object('lead_id', v_lead.id), v_client, null, false);

  if p_project is not null and nullif(p_project->>'name', '') is not null then
    if not public.has_permission(v_lead.organization_id, 'projects.manage') then
      raise exception 'You need project management permission to create the project.' using errcode = 'insufficient_privilege';
    end if;
    insert into public.projects (organization_id, code, name, client_id, service_id, lead_id, description, start_date, due_date,
                                 project_manager_id, status, created_by)
    values (v_lead.organization_id, '', p_project->>'name', v_client,
            coalesce(nullif(p_project->>'service_id', '')::uuid, v_lead.service_id), v_lead.id,
            coalesce(nullif(p_project->>'description', ''), v_lead.description),
            nullif(p_project->>'start_date', '')::date, nullif(p_project->>'due_date', '')::date,
            coalesce(nullif(p_project->>'project_manager_id', '')::uuid, (select auth.uid())), 'planning', (select auth.uid()))
    returning id into v_project;
    insert into public.project_finances (project_id, organization_id, budget_cents)
    values (v_project, v_lead.organization_id, coalesce(nullif(p_project->>'budget_cents', '')::bigint, v_lead.budget_cents));
    if nullif(p_project->>'template_id', '') is not null then
      perform public.apply_project_template(v_project, (p_project->>'template_id')::uuid, nullif(p_project->>'start_date', '')::date);
    end if;
  end if;

  return jsonb_build_object('client_id', v_client, 'project_id', v_project, 'already_converted', false);
end $$;
grant execute on function public.convert_lead(uuid, jsonb, jsonb, boolean) to authenticated;
revoke execute on function public.convert_lead(uuid, jsonb, jsonb, boolean) from anon, public;

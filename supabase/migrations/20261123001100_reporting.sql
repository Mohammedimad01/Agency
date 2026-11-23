-- =============================================================================
-- REPORTING (SECURITY INVOKER: callers only aggregate rows RLS lets them see)
-- Revenue = completed payments (cash basis). Amounts are BIGINT minor units.
-- =============================================================================

create or replace function public.report_monthly_finance(p_org uuid, p_from date, p_to date)
returns table (month date, revenue_cents bigint, expenses_cents bigint, invoiced_cents bigint)
language sql stable security invoker set search_path = '' as $$
  with months as (
    select generate_series(date_trunc('month', p_from), date_trunc('month', p_to), interval '1 month')::date as month
  )
  select m.month,
    coalesce((select sum(p.amount_cents) from public.payments p
              where p.organization_id = p_org and p.status = 'completed'
                and date_trunc('month', p.payment_date) = m.month), 0)::bigint,
    coalesce((select sum(e.amount_cents) from public.expenses e
              where e.organization_id = p_org and e.deleted_at is null
                and date_trunc('month', e.expense_date) = m.month), 0)::bigint,
    coalesce((select sum(i.total_cents) from public.invoices i
              where i.organization_id = p_org and i.deleted_at is null and i.status not in ('draft','cancelled')
                and date_trunc('month', i.issue_date) = m.month), 0)::bigint
  from months m order by m.month;
$$;

create or replace function public.report_revenue_by_client(p_org uuid, p_from date, p_to date)
returns table (client_id uuid, client_name text, revenue_cents bigint, invoiced_cents bigint, outstanding_cents bigint, projects int)
language sql stable security invoker set search_path = '' as $$
  select c.id, c.name,
    coalesce((select sum(p.amount_cents) from public.payments p where p.client_id = c.id and p.status = 'completed'
              and p.payment_date between p_from and p_to), 0)::bigint,
    coalesce((select sum(i.total_cents) from public.invoices i where i.client_id = c.id and i.deleted_at is null
              and i.status not in ('draft','cancelled') and i.issue_date between p_from and p_to), 0)::bigint,
    coalesce((select sum(i.balance_cents) from public.invoices i where i.client_id = c.id and i.deleted_at is null
              and i.status in ('sent','partially_paid','overdue')), 0)::bigint,
    (select count(*) from public.projects pr where pr.client_id = c.id and pr.deleted_at is null)::int
  from public.clients c
  where c.organization_id = p_org and c.deleted_at is null
  order by 3 desc, 4 desc;
$$;

create or replace function public.report_revenue_by_service(p_org uuid, p_from date, p_to date)
returns table (service_name text, revenue_cents bigint, projects int)
language sql stable security invoker set search_path = '' as $$
  select coalesce(s.name, 'Unassigned') as service_name,
         coalesce(sum(p.amount_cents), 0)::bigint,
         count(distinct pr.id)::int
  from public.payments p
  left join public.projects pr on pr.id = p.project_id
  left join public.services s on s.id = pr.service_id
  where p.organization_id = p_org and p.status = 'completed' and p.payment_date between p_from and p_to
  group by 1 order by 2 desc;
$$;

create or replace function public.report_project_profitability(p_org uuid)
returns table (project_id uuid, code text, name text, client_name text, status public.project_status,
               contract_value_cents bigint, invoiced_cents bigint, collected_cents bigint, expenses_cents bigint,
               labor_cost_cents bigint, profit_cents bigint, hours numeric)
language sql stable security invoker set search_path = '' as $$
  with base as (
    select pr.id, pr.code, pr.name, c.name as client_name, pr.status, coalesce(pr.contract_value_cents, 0) as contract_value_cents,
      coalesce((select sum(i.total_cents) from public.invoices i where i.project_id = pr.id and i.deleted_at is null and i.status not in ('draft','cancelled')), 0) as invoiced,
      coalesce((select sum(p.amount_cents) from public.payments p where p.project_id = pr.id and p.status = 'completed'), 0) as collected,
      coalesce((select sum(e.amount_cents) from public.expenses e where e.project_id = pr.id and e.deleted_at is null), 0) as expenses,
      coalesce((select sum(round(te.minutes::numeric / 60 * coalesce(tm.hourly_cost_cents, 0)))
                from public.time_entries te
                left join public.team_members tm on tm.profile_id = te.profile_id and tm.organization_id = pr.organization_id
                where te.project_id = pr.id), 0) as labor,
      coalesce((select sum(te.minutes) from public.time_entries te where te.project_id = pr.id), 0) / 60.0 as hours
    from public.projects pr join public.clients c on c.id = pr.client_id
    where pr.organization_id = p_org and pr.deleted_at is null
  )
  select id, code, name, client_name, status, contract_value_cents::bigint, invoiced::bigint, collected::bigint, expenses::bigint,
         labor::bigint, (collected - expenses - labor)::bigint, round(hours, 1)
  from base order by (collected - expenses - labor) desc;
$$;

create or replace function public.report_lead_funnel(p_org uuid, p_from date, p_to date)
returns table (month date, created int, won int, lost int)
language sql stable security invoker set search_path = '' as $$
  with months as (
    select generate_series(date_trunc('month', p_from), date_trunc('month', p_to), interval '1 month')::date as month
  )
  select m.month,
    (select count(*) from public.leads l where l.organization_id = p_org and l.deleted_at is null and date_trunc('month', l.created_at)::date = m.month)::int,
    (select count(*) from public.leads l where l.organization_id = p_org and l.deleted_at is null and l.status = 'won'
       and date_trunc('month', coalesce(l.converted_at, l.updated_at))::date = m.month)::int,
    (select count(*) from public.leads l where l.organization_id = p_org and l.deleted_at is null and l.status in ('lost','not_qualified')
       and date_trunc('month', l.updated_at)::date = m.month)::int
  from months m order by m.month;
$$;

create or replace function public.report_lead_breakdown(p_org uuid, p_from date, p_to date)
returns table (dimension text, key text, total int, won int)
language sql stable security invoker set search_path = '' as $$
  select 'source', coalesce(source, 'unknown'), count(*)::int, count(*) filter (where status = 'won')::int
    from public.leads where organization_id = p_org and deleted_at is null and created_at::date between p_from and p_to group by 2
  union all
  select 'status', status::text, count(*)::int, count(*) filter (where status = 'won')::int
    from public.leads where organization_id = p_org and deleted_at is null and created_at::date between p_from and p_to group by 2
  union all
  select 'service', coalesce(requested_service, 'Unspecified'), count(*)::int, count(*) filter (where status = 'won')::int
    from public.leads where organization_id = p_org and deleted_at is null and created_at::date between p_from and p_to group by 2;
$$;

create or replace function public.report_team_workload(p_org uuid)
returns table (profile_id uuid, full_name text, role_key text, open_tasks int, overdue_tasks int, due_this_week int,
               estimated_hours numeric, capacity_hours int, active_projects int, logged_hours_30d numeric)
language sql stable security invoker set search_path = '' as $$
  select tm.profile_id, coalesce(p.full_name, p.email::text), tm.role_key,
    (select count(*) from public.tasks t where t.assignee_id = tm.profile_id and t.deleted_at is null and t.status <> 'done')::int,
    (select count(*) from public.tasks t where t.assignee_id = tm.profile_id and t.deleted_at is null and t.status <> 'done' and t.due_date < current_date)::int,
    (select count(*) from public.tasks t where t.assignee_id = tm.profile_id and t.deleted_at is null and t.status <> 'done' and t.due_date between current_date and current_date + 7)::int,
    coalesce((select sum(t.estimated_hours) from public.tasks t where t.assignee_id = tm.profile_id and t.deleted_at is null and t.status <> 'done'), 0),
    tm.capacity_hours_per_week,
    (select count(distinct pr.id) from public.projects pr left join public.project_members pm on pm.project_id = pr.id
      where pr.deleted_at is null and pr.status in ('planning','in_progress','awaiting_client','in_review')
        and (pr.project_manager_id = tm.profile_id or pm.profile_id = tm.profile_id))::int,
    round(coalesce((select sum(te.minutes) from public.time_entries te where te.profile_id = tm.profile_id and te.entry_date >= current_date - 30), 0) / 60.0, 1)
  from public.team_members tm join public.profiles p on p.id = tm.profile_id
  where tm.organization_id = p_org and tm.status = 'active'
  order by 4 desc;
$$;

create or replace function public.report_project_delivery(p_org uuid, p_from date, p_to date)
returns table (completed int, on_time int, late int, avg_days_late numeric, active int, overdue int)
language sql stable security invoker set search_path = '' as $$
  select
    count(*) filter (where status = 'completed' and completed_at::date between p_from and p_to)::int,
    count(*) filter (where status = 'completed' and completed_at::date between p_from and p_to and (due_date is null or completed_at::date <= due_date))::int,
    count(*) filter (where status = 'completed' and completed_at::date between p_from and p_to and due_date is not null and completed_at::date > due_date)::int,
    round(avg(completed_at::date - due_date) filter (where status = 'completed' and completed_at::date between p_from and p_to and due_date is not null and completed_at::date > due_date), 1),
    count(*) filter (where status in ('planning','in_progress','awaiting_client','in_review'))::int,
    count(*) filter (where status not in ('completed','cancelled','draft') and due_date < current_date)::int
  from public.projects where organization_id = p_org and deleted_at is null;
$$;

grant execute on function public.report_monthly_finance(uuid, date, date), public.report_revenue_by_client(uuid, date, date),
  public.report_revenue_by_service(uuid, date, date), public.report_project_profitability(uuid), public.report_lead_funnel(uuid, date, date),
  public.report_lead_breakdown(uuid, date, date), public.report_team_workload(uuid), public.report_project_delivery(uuid, date, date) to authenticated;
revoke execute on function public.report_monthly_finance(uuid, date, date), public.report_revenue_by_client(uuid, date, date),
  public.report_revenue_by_service(uuid, date, date), public.report_project_profitability(uuid), public.report_lead_funnel(uuid, date, date),
  public.report_lead_breakdown(uuid, date, date), public.report_team_workload(uuid), public.report_project_delivery(uuid, date, date) from anon, public;

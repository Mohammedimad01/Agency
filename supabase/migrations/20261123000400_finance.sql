-- =============================================================================
-- SALES & FINANCE: proposals, contracts, invoices, payments, expenses
-- Money is always stored as BIGINT minor units (cents). Quantities are NUMERIC.
-- All totals are computed in the database; client-submitted totals are ignored.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Pure calculation helpers (mirrored in src/lib/finance/calculations.ts)
-- ---------------------------------------------------------------------------
create or replace function public.calc_line_amount(p_quantity numeric, p_unit_price_cents bigint)
returns bigint language sql immutable set search_path = '' as $$
  select round(p_quantity * p_unit_price_cents::numeric)::bigint;
$$;

-- discount value: basis points for 'percent' (1000 = 10%), cents for 'fixed'
create or replace function public.calc_discount_cents(p_subtotal bigint, p_type public.discount_type, p_value bigint)
returns bigint language sql immutable set search_path = '' as $$
  select case p_type
    when 'percent' then least(p_subtotal, round(p_subtotal::numeric * least(greatest(p_value, 0), 10000)::numeric / 10000)::bigint)
    when 'fixed'   then least(p_subtotal, greatest(p_value, 0))
    else 0::bigint end;
$$;

create or replace function public.calc_tax_cents(p_taxable bigint, p_tax_rate_bps int)
returns bigint language sql immutable set search_path = '' as $$
  select round(greatest(p_taxable, 0)::numeric * greatest(p_tax_rate_bps, 0)::numeric / 10000)::bigint;
$$;

-- ---------------------------------------------------------------------------
-- Document numbering (atomic counters stored in settings)
-- ---------------------------------------------------------------------------
create or replace function private.next_document_number(p_org uuid, p_kind text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_result text;
begin
  insert into public.settings (organization_id) values (p_org) on conflict do nothing;
  if p_kind = 'invoice' then
    update public.settings set next_invoice_number = next_invoice_number + 1
      where organization_id = p_org
      returning invoice_prefix || lpad((next_invoice_number - 1)::text, 4, '0') into v_result;
  elsif p_kind = 'proposal' then
    update public.settings set next_proposal_number = next_proposal_number + 1
      where organization_id = p_org
      returning proposal_prefix || lpad((next_proposal_number - 1)::text, 4, '0') into v_result;
  elsif p_kind = 'project' then
    update public.settings set next_project_number = next_project_number + 1
      where organization_id = p_org
      returning project_prefix || lpad((next_project_number - 1)::text, 4, '0') into v_result;
  else
    raise exception 'unknown document kind %', p_kind;
  end if;
  return v_result;
end $$;

create or replace function private.assign_project_code()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.code is null or new.code = '' then
    new.code := private.next_document_number(new.organization_id, 'project');
  end if;
  return new;
end $$;
create trigger trg_projects_code before insert on public.projects
  for each row execute function private.assign_project_code();

-- ---------------------------------------------------------------------------
-- Proposals
-- ---------------------------------------------------------------------------
create table public.proposals (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  number               text not null,
  client_id            uuid references public.clients(id) on delete restrict,
  lead_id              uuid references public.leads(id) on delete set null,
  title                text not null check (char_length(title) between 1 and 200),
  summary              text,
  scope                text,
  timeline             text,
  payment_terms        text,
  valid_until          date,
  status               public.proposal_status not null default 'draft',
  currency             char(3) not null default 'USD',
  subtotal_cents       bigint not null default 0 check (subtotal_cents >= 0),
  discount_type        public.discount_type not null default 'none',
  discount_value       bigint not null default 0 check (discount_value >= 0),
  discount_cents       bigint not null default 0 check (discount_cents >= 0),
  tax_rate_bps         int not null default 0 check (tax_rate_bps between 0 and 10000),
  tax_cents            bigint not null default 0 check (tax_cents >= 0),
  total_cents          bigint not null default 0 check (total_cents >= 0),
  sent_at              timestamptz,
  viewed_at            timestamptz,
  responded_at         timestamptz,
  responded_by         uuid references public.profiles(id) on delete set null,
  client_response_note text,
  project_id           uuid references public.projects(id) on delete set null,
  created_by           uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  unique (organization_id, number),
  check (client_id is not null or lead_id is not null)
);
create index proposals_org_status_idx on public.proposals (organization_id, status) where deleted_at is null;
create index proposals_client_idx on public.proposals (client_id);
create trigger trg_proposals_updated before update on public.proposals
  for each row execute function public.set_updated_at();

alter table public.projects
  add constraint projects_proposal_fk foreign key (proposal_id) references public.proposals(id) on delete set null;

create table public.proposal_items (
  id                uuid primary key default gen_random_uuid(),
  proposal_id       uuid not null references public.proposals(id) on delete cascade,
  service_id        uuid references public.services(id) on delete set null,
  description       text not null check (char_length(description) between 1 and 500),
  details           text,
  quantity          numeric(12,2) not null default 1 check (quantity > 0),
  unit_price_cents  bigint not null check (unit_price_cents >= 0),
  amount_cents      bigint not null default 0,
  sort_order        int not null default 0
);
create index proposal_items_proposal_idx on public.proposal_items (proposal_id, sort_order);

-- ---------------------------------------------------------------------------
-- Contracts
-- ---------------------------------------------------------------------------
create table public.contracts (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  client_id         uuid not null references public.clients(id) on delete restrict,
  project_id        uuid references public.projects(id) on delete set null,
  proposal_id       uuid references public.proposals(id) on delete set null,
  title             text not null,
  description       text,
  status            public.contract_status not null default 'draft',
  value_cents       bigint check (value_cents >= 0),
  start_date        date,
  end_date          date,
  signed_at         timestamptz,
  signed_by_name    text,
  accepted_at       timestamptz,
  accepted_by       uuid references public.profiles(id) on delete set null,
  current_version   int not null default 0,
  notes             text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index contracts_org_idx on public.contracts (organization_id, status) where deleted_at is null;
create index contracts_client_idx on public.contracts (client_id);
create trigger trg_contracts_updated before update on public.contracts
  for each row execute function public.set_updated_at();

create table public.contract_versions (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references public.contracts(id) on delete cascade,
  version      int not null check (version > 0),
  file_id      uuid not null references public.files(id) on delete restrict,
  notes        text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (contract_id, version)
);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
create table public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  number             text not null,
  client_id          uuid not null references public.clients(id) on delete restrict,
  project_id         uuid references public.projects(id) on delete set null,
  proposal_id        uuid references public.proposals(id) on delete set null,
  issue_date         date not null default current_date,
  due_date           date not null,
  status             public.invoice_status not null default 'draft',
  currency           char(3) not null default 'USD',
  subtotal_cents     bigint not null default 0 check (subtotal_cents >= 0),
  discount_type      public.discount_type not null default 'none',
  discount_value     bigint not null default 0 check (discount_value >= 0),
  discount_cents     bigint not null default 0 check (discount_cents >= 0),
  tax_rate_bps       int not null default 0 check (tax_rate_bps between 0 and 10000),
  tax_cents          bigint not null default 0 check (tax_cents >= 0),
  total_cents        bigint not null default 0 check (total_cents >= 0),
  amount_paid_cents  bigint not null default 0 check (amount_paid_cents >= 0),
  balance_cents      bigint generated always as (total_cents - amount_paid_cents) stored,
  payment_terms      text,
  notes              text,
  sent_at            timestamptz,
  paid_at            timestamptz,
  cancelled_at       timestamptz,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  unique (organization_id, number),
  check (due_date >= issue_date),
  check (amount_paid_cents <= total_cents)
);
create index invoices_org_status_idx on public.invoices (organization_id, status) where deleted_at is null;
create index invoices_client_idx on public.invoices (client_id);
create index invoices_project_idx on public.invoices (project_id);
create index invoices_due_idx on public.invoices (due_date) where deleted_at is null;
create trigger trg_invoices_updated before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_items (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references public.invoices(id) on delete cascade,
  service_id        uuid references public.services(id) on delete set null,
  description       text not null check (char_length(description) between 1 and 500),
  quantity          numeric(12,2) not null default 1 check (quantity > 0),
  unit_price_cents  bigint not null check (unit_price_cents >= 0),
  amount_cents      bigint not null default 0,
  sort_order        int not null default 0
);
create index invoice_items_invoice_idx on public.invoice_items (invoice_id, sort_order);

-- ---------------------------------------------------------------------------
-- Payments (manual recording; provider integrations write here too)
-- ---------------------------------------------------------------------------
create table public.payments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  invoice_id        uuid not null references public.invoices(id) on delete restrict,
  client_id         uuid not null references public.clients(id) on delete restrict,
  project_id        uuid references public.projects(id) on delete set null,
  amount_cents      bigint not null check (amount_cents > 0),
  payment_date      date not null default current_date,
  method            public.payment_method not null default 'bank_transfer',
  reference         text,
  status            public.payment_status not null default 'completed',
  provider          text not null default 'manual',
  provider_payment_id text,
  notes             text,
  idempotency_key   text unique,
  recorded_by       uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index payments_invoice_idx on public.payments (invoice_id);
create index payments_org_date_idx on public.payments (organization_id, payment_date);
create unique index payments_provider_uniq on public.payments (provider, provider_payment_id) where provider_payment_id is not null;
create trigger trg_payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Expenses
-- ---------------------------------------------------------------------------
create table public.expenses (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  category         text not null check (category in ('software','hardware','contractor','marketing','office','travel','hosting','fees','taxes','other')),
  description      text not null,
  amount_cents     bigint not null check (amount_cents > 0),
  expense_date     date not null default current_date,
  vendor           text,
  project_id       uuid references public.projects(id) on delete set null,
  receipt_file_id  uuid references public.files(id) on delete set null,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index expenses_org_date_idx on public.expenses (organization_id, expense_date) where deleted_at is null;
create index expenses_project_idx on public.expenses (project_id);
create trigger trg_expenses_updated before update on public.expenses
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Financial integrity triggers
-- =============================================================================

-- Numbering + currency defaults for proposals & invoices
create or replace function private.before_insert_financial_doc()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_currency char(3);
begin
  if new.number is null or new.number = '' then
    new.number := private.next_document_number(new.organization_id, case tg_table_name when 'invoices' then 'invoice' else 'proposal' end);
  end if;
  select currency into v_currency from public.settings where organization_id = new.organization_id;
  new.currency := coalesce(v_currency, new.currency, 'USD');
  return new;
end $$;
create trigger trg_proposals_number before insert on public.proposals
  for each row execute function private.before_insert_financial_doc();
create trigger trg_invoices_number before insert on public.invoices
  for each row execute function private.before_insert_financial_doc();

-- Totals: computed on every insert/update of a proposal
create or replace function private.compute_proposal_totals()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.discount_cents := public.calc_discount_cents(new.subtotal_cents, new.discount_type, new.discount_value);
  new.tax_cents      := public.calc_tax_cents(new.subtotal_cents - new.discount_cents, new.tax_rate_bps);
  new.total_cents    := new.subtotal_cents - new.discount_cents + new.tax_cents;
  return new;
end $$;
create trigger trg_proposals_totals before insert or update on public.proposals
  for each row execute function private.compute_proposal_totals();

-- Totals + payment-derived status for invoices
create or replace function private.compute_invoice_totals()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.discount_cents := public.calc_discount_cents(new.subtotal_cents, new.discount_type, new.discount_value);
  new.tax_cents      := public.calc_tax_cents(new.subtotal_cents - new.discount_cents, new.tax_rate_bps);
  new.total_cents    := new.subtotal_cents - new.discount_cents + new.tax_cents;

  if new.total_cents < new.amount_paid_cents then
    raise exception 'Invoice total (%) cannot be less than the amount already paid (%)', new.total_cents, new.amount_paid_cents
      using errcode = 'check_violation';
  end if;

  if new.status = 'cancelled' then
    if new.amount_paid_cents > 0 then
      raise exception 'An invoice with recorded payments cannot be cancelled. Refund the payments first.'
        using errcode = 'check_violation';
    end if;
    new.cancelled_at := coalesce(new.cancelled_at, now());
  elsif new.status = 'draft' then
    if new.amount_paid_cents > 0 then
      raise exception 'An invoice with recorded payments cannot return to draft.' using errcode = 'check_violation';
    end if;
  else
    -- Status is derived from real payments, never trusted from input.
    if new.total_cents > 0 and new.amount_paid_cents >= new.total_cents then
      new.status := 'paid';
      new.paid_at := coalesce(new.paid_at, now());
    elsif new.amount_paid_cents > 0 then
      new.status := case when new.due_date < current_date then 'overdue' else 'partially_paid' end;
      new.paid_at := null;
    else
      if new.status in ('paid','partially_paid') or (new.status = 'overdue' and new.due_date >= current_date) then
        new.status := case when new.due_date < current_date then 'overdue' else 'sent' end;
      end if;
      new.paid_at := null;
    end if;
    new.sent_at := coalesce(new.sent_at, now());
  end if;
  return new;
end $$;
create trigger trg_invoices_totals before insert or update on public.invoices
  for each row execute function private.compute_invoice_totals();

-- Line items: compute amount, guard locked documents, roll up subtotal
create or replace function private.before_line_item()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_locked boolean;
begin
  if tg_table_name = 'invoice_items' then
    select (i.amount_paid_cents > 0 or i.status in ('paid','cancelled')) into v_locked
      from public.invoices i where i.id = (case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end);
    if v_locked then
      raise exception 'Line items of paid, partially paid or cancelled invoices cannot be changed.' using errcode = 'check_violation';
    end if;
  else
    select p.status in ('accepted','rejected','expired') into v_locked
      from public.proposals p where p.id = (case when tg_op = 'DELETE' then old.proposal_id else new.proposal_id end);
    if v_locked then
      raise exception 'Line items of accepted, rejected or expired proposals cannot be changed.' using errcode = 'check_violation';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  new.amount_cents := public.calc_line_amount(new.quantity, new.unit_price_cents);
  return new;
end $$;

create or replace function private.after_line_item()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if tg_table_name = 'invoice_items' then
    v_id := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
    update public.invoices set subtotal_cents =
      (select coalesce(sum(amount_cents), 0) from public.invoice_items where invoice_id = v_id)
      where id = v_id;
  else
    v_id := case when tg_op = 'DELETE' then old.proposal_id else new.proposal_id end;
    update public.proposals set subtotal_cents =
      (select coalesce(sum(amount_cents), 0) from public.proposal_items where proposal_id = v_id)
      where id = v_id;
  end if;
  return null;
end $$;

create trigger trg_invoice_items_before before insert or update or delete on public.invoice_items
  for each row execute function private.before_line_item();
create trigger trg_invoice_items_after after insert or update or delete on public.invoice_items
  for each row execute function private.after_line_item();
create trigger trg_proposal_items_before before insert or update or delete on public.proposal_items
  for each row execute function private.before_line_item();
create trigger trg_proposal_items_after after insert or update or delete on public.proposal_items
  for each row execute function private.after_line_item();

-- Payments: derive ownership from the invoice, prevent overpayment, roll up balance
create or replace function private.before_payment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_inv public.invoices%rowtype; v_paid bigint;
begin
  -- Serialize concurrent payments against the same invoice
  select * into v_inv from public.invoices where id = new.invoice_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if v_inv.status in ('draft','cancelled') then
    raise exception 'Payments can only be recorded against issued invoices (current status: %).', v_inv.status
      using errcode = 'check_violation';
  end if;
  -- Never trust client-submitted ownership
  new.organization_id := v_inv.organization_id;
  new.client_id       := v_inv.client_id;
  new.project_id      := coalesce(new.project_id, v_inv.project_id);

  if new.status = 'completed' then
    select coalesce(sum(amount_cents), 0) into v_paid from public.payments
      where invoice_id = new.invoice_id and status = 'completed'
        and id <> coalesce(case when tg_op = 'UPDATE' then old.id end, '00000000-0000-0000-0000-000000000000'::uuid);
    if v_paid + new.amount_cents > v_inv.total_cents then
      raise exception 'Payment of % exceeds the outstanding balance of %.', new.amount_cents, v_inv.total_cents - v_paid
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create or replace function private.after_payment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_invoice uuid;
begin
  v_invoice := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
  update public.invoices set amount_paid_cents =
    (select coalesce(sum(amount_cents), 0) from public.payments where invoice_id = v_invoice and status = 'completed')
    where id = v_invoice;
  if tg_op = 'UPDATE' and old.invoice_id <> new.invoice_id then
    update public.invoices set amount_paid_cents =
      (select coalesce(sum(amount_cents), 0) from public.payments where invoice_id = old.invoice_id and status = 'completed')
      where id = old.invoice_id;
  end if;
  return null;
end $$;

create trigger trg_payments_before before insert or update on public.payments
  for each row execute function private.before_payment();
create trigger trg_payments_after after insert or update or delete on public.payments
  for each row execute function private.after_payment();

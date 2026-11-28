-- =============================================================================
-- AUTOMATED-TEST FIXTURE — load into a LOCAL test database only, never production.
-- Loaded by `npm run db:test-data` (scripts/load-test-data.sh). The account
-- password is supplied at load time via TEST_USER_PASSWORD; none is stored here.
-- =============================================================================
create or replace function pg_temp.seed_user(p_email text, p_name text) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(current_setting('fixture.password'), extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name), now(), now(), '', '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text, 'email',
    jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true), now(), now(), now());
  return v_id;
end $$;

do $$
declare
  u_owner uuid; u_pm uuid; u_dev uuid; u_design uuid; u_fin uuid; u_acme uuid; u_globex uuid;
  v_org uuid; c_acme uuid; c_globex uuid; c_nadia uuid;
  p_acme uuid; p_globex uuid; p_old uuid; tpl_web uuid; tpl_bi uuid;
  pr_acme uuid; pr_globex uuid; inv1 uuid; inv2 uuid; inv3 uuid; d1 uuid; f1 uuid;
  s_web uuid; s_bi uuid; s_brand uuid; s_ai uuid; conv uuid;
begin
  u_owner  := pg_temp.seed_user('owner@team.test',   'Amina Rahman');
  u_pm     := pg_temp.seed_user('pm@team.test',      'Yusuf Khan');
  u_dev    := pg_temp.seed_user('dev@team.test',     'Omar Farooq');
  u_design := pg_temp.seed_user('design@team.test',  'Layla Hassan');
  u_fin    := pg_temp.seed_user('finance@team.test', 'Sara Malik');
  u_acme   := pg_temp.seed_user('client@acme.test',      'John Carter');
  u_globex := pg_temp.seed_user('client@globex.test',    'Priya Nair');

  v_org := public.bootstrap_organization(u_owner, 'Test Agency', 'test-agency', 'USD', 'Asia/Dubai');
  update public.settings set default_tax_rate_bps = 500, company_email = 'owner@team.test',
    company_phone = '+971 50 000 0000', company_address = 'Dubai, United Arab Emirates',
    payment_instructions = E'Bank: Example Bank\nAccount name: Test Agency\nIBAN: AE00 0000 0000 0000 0000 000\nReference: your invoice number'
  where organization_id = v_org;

  insert into public.team_members (organization_id, profile_id, role_key, status, joined_at, title, invited_by) values
    (v_org, u_pm, 'project_manager', 'active', now(), 'Head of Delivery', u_owner),
    (v_org, u_dev, 'developer', 'active', now(), 'Senior Engineer', u_owner),
    (v_org, u_design, 'designer', 'active', now(), 'Product Designer', u_owner),
    (v_org, u_fin, 'finance_manager', 'active', now(), 'Finance Lead', u_owner);

  select id into s_web from public.services where organization_id = v_org and slug = 'website-development';
  select id into s_bi from public.services where organization_id = v_org and slug = 'power-bi';
  select id into s_brand from public.services where organization_id = v_org and slug = 'branding';
  select id into s_ai from public.services where organization_id = v_org and slug = 'ai-automation';
  update public.services set starting_price_cents = v.p from (values
    ('website-development', 250000), ('web-design', 150000), ('ecommerce', 450000), ('ui-ux-design', 200000),
    ('custom-web-apps', 900000), ('mobile-apps', 1200000), ('business-software', 1500000), ('invoicing-apps', 350000),
    ('quotation-apps', 350000), ('erp-software', 2500000), ('seo-services', 80000), ('google-search-console', 30000),
    ('technical-seo', 120000), ('ai-search-optimization', 100000), ('local-seo', 60000), ('digital-marketing', 100000),
    ('ai-automation', 300000), ('power-bi', 280000), ('branding', 250000), ('website-maintenance', 25000), ('hosting-infrastructure', 15000)) v(slug, p)
  where services.slug = v.slug and services.organization_id = v_org;
  select id into tpl_web from public.project_templates where organization_id = v_org and name = 'Website Development';
  select id into tpl_bi from public.project_templates where organization_id = v_org and name = 'Power BI Dashboard';

  -- Clients ------------------------------------------------------------------
  insert into public.clients (organization_id, type, name, company_name, email, phone, website, industry, city, country, source, account_manager_id, created_by)
  values (v_org, 'company', 'Acme Logistics', 'Acme Logistics LLC', 'ops@acme.test', '+1 555 0100', 'https://acme.test', 'Logistics', 'Austin', 'United States', 'referral', u_pm, u_owner)
  returning id into c_acme;
  insert into public.clients (organization_id, type, name, company_name, email, website, industry, city, country, source, account_manager_id, created_by)
  values (v_org, 'company', 'Globex Retail', 'Globex Retail Group', 'finance@globex.test', 'https://globex.test', 'Retail', 'London', 'United Kingdom', 'website', u_owner, u_owner)
  returning id into c_globex;
  insert into public.clients (organization_id, type, name, email, industry, city, country, source, account_manager_id, created_by)
  values (v_org, 'individual', 'Nadia Studio', 'nadia@studio.test', 'Photography', 'Toronto', 'Canada', 'instagram', u_pm, u_owner)
  returning id into c_nadia;

  insert into public.client_contacts (organization_id, client_id, profile_id, full_name, email, job_title, is_primary, portal_access, invited_at) values
    (v_org, c_acme, u_acme, 'John Carter', 'client@acme.test', 'Operations Director', true, true, now()),
    (v_org, c_globex, u_globex, 'Priya Nair', 'client@globex.test', 'Head of Finance', true, true, now()),
    (v_org, c_nadia, null, 'Nadia Ahmed', 'nadia@studio.test', 'Founder', true, false, null);

  -- Leads --------------------------------------------------------------------
  insert into public.leads (organization_id, full_name, company, email, phone, industry, country, source, service_id, requested_service,
                            budget_cents, budget_range, timeline, description, assigned_to, qualification_score, priority, status, follow_up_at, created_at)
  values
    (v_org, 'Daniel Okafor', 'Brightpath Health', 'daniel@brightpath.test', '+44 20 0000 0001', 'Healthcare', 'United Kingdom', 'website', s_ai,
     'AI automation', 1500000, '$10k–$25k', '1–3 months', 'Patient intake assistant that summarises forms for clinicians.', u_owner, 82, 'high', 'qualified', now() + interval '1 day', now() - interval '6 days'),
    (v_org, 'Mei Tanaka', 'Kumo Coffee', 'mei@kumo.test', null, 'Hospitality', 'Japan', 'instagram', s_brand,
     'Branding', 400000, '$2.5k–$5k', 'Flexible', 'Rebrand for our second location opening in spring.', u_design, 64, 'medium', 'discovery', now() - interval '2 hours', now() - interval '12 days'),
    (v_org, 'Carlos Mendes', 'Mendes Construction', 'carlos@mendes.test', '+55 11 0000 0000', 'Construction', 'Brazil', 'referral', s_bi,
     'Power BI & analytics', 800000, '$5k–$10k', 'Within a month', 'Project cost tracking across 14 sites.', u_pm, 71, 'medium', 'proposal_sent', now() + interval '3 days', now() - interval '20 days'),
    (v_org, 'Hannah Schmidt', null, 'hannah@schmidt.test', null, 'Education', 'Germany', 'website', s_web,
     'Web development', 150000, 'Under $2.5k', 'ASAP', 'Simple website for my tutoring business.', null, 38, 'low', 'new', null, now() - interval '1 day'),
    (v_org, 'Ibrahim Saleh', 'Saleh Trading', 'ibrahim@saleh.test', '+971 4 000 0000', 'Trade', 'United Arab Emirates', 'linkedin', s_web,
     'Web development', 600000, '$5k–$10k', '1–3 months', 'B2B catalogue site with quote requests.', u_pm, 75, 'high', 'negotiation', now() + interval '5 hours', now() - interval '30 days'),
    (v_org, 'Grace Liu', 'Northwind Labs', 'grace@northwind.test', null, 'SaaS', 'Singapore', 'website', null,
     'AI automation', null, 'Not sure yet', 'Flexible', 'Exploring options.', null, 22, 'low', 'not_qualified', null, now() - interval '40 days'),
    (v_org, 'John Carter', 'Acme Logistics', 'client@acme.test', '+1 555 0100', 'Logistics', 'United States', 'referral', s_web,
     'Web development', 900000, '$5k–$10k', '1–3 months', 'New corporate website with a shipment tracking widget.', u_pm, 88, 'high', 'won', null, now() - interval '75 days');
  update public.leads set converted_client_id = c_acme, converted_at = now() - interval '60 days' where email = 'client@acme.test' and organization_id = v_org;

  -- Proposals ----------------------------------------------------------------
  insert into public.proposals (organization_id, client_id, title, summary, scope, timeline, payment_terms, valid_until, status,
                                tax_rate_bps, discount_type, discount_value, created_by, created_at)
  values (v_org, c_acme, 'Acme corporate website', 'A fast, modern corporate website with shipment tracking.',
          E'• Discovery & UX\n• Design system & 8 page templates\n• Next.js build with CMS\n• Tracking widget integration',
          '8 weeks', '40% deposit, 40% at design approval, 20% on launch', current_date + 30, 'draft', 500, 'percent', 500, u_owner, now() - interval '62 days')
  returning id into pr_acme;
  insert into public.proposal_items (proposal_id, service_id, description, quantity, unit_price_cents, sort_order) values
    (pr_acme, s_web, 'Website design & development', 1, 750000, 1),
    (pr_acme, null, 'Shipment tracking widget', 1, 180000, 2),
    (pr_acme, null, 'Content migration (pages)', 12, 5000, 3);
  update public.proposals set status = 'sent' where id = pr_acme;
  update public.proposals set status = 'accepted', responded_at = now() - interval '58 days', responded_by = u_acme where id = pr_acme;

  insert into public.proposals (organization_id, client_id, title, summary, timeline, payment_terms, valid_until, status, tax_rate_bps, created_by)
  values (v_org, c_globex, 'Retail performance dashboards', 'Executive and store-level Power BI reporting.', '5 weeks',
          '50% upfront, 50% on delivery', current_date + 14, 'draft', 0, u_fin)
  returning id into pr_globex;
  insert into public.proposal_items (proposal_id, service_id, description, quantity, unit_price_cents, sort_order) values
    (pr_globex, s_bi, 'Power BI semantic model & dashboards', 1, 420000, 1),
    (pr_globex, null, 'Training workshop (hours)', 6, 15000, 2);
  update public.proposals set status = 'sent' where id = pr_globex;

  -- Projects -----------------------------------------------------------------
  insert into public.projects (organization_id, name, client_id, service_id, proposal_id, description, scope,
                               start_date, priority, status, project_manager_id, internal_notes, created_by)
  values (v_org, 'Acme Corporate Website', c_acme, s_web, pr_acme, 'Corporate website redesign with shipment tracking.',
          'Design and build of the marketing website, CMS and tracking widget.', current_date - 30, 'high',
          'in_progress', u_pm, 'Client prefers async updates. Legal review needed for the privacy page.', u_owner)
  returning id into p_acme;
  insert into public.project_finances (project_id, organization_id, budget_cents, contract_value_cents) values (p_acme, v_org, 900000, 987525);
  update public.proposals set project_id = p_acme where id = pr_acme;
  insert into public.project_members (project_id, profile_id, role, added_by) values
    (p_acme, u_dev, 'Lead developer', u_pm), (p_acme, u_design, 'Designer', u_pm);
  perform public.apply_project_template(p_acme, tpl_web, current_date - 30);
  -- progress the first milestones realistically
  update public.tasks set status = 'done' where project_id = p_acme and milestone_id in
    (select id from public.milestones where project_id = p_acme and sort_order <= 4);
  update public.tasks set status = 'in_progress' where project_id = p_acme and title = 'Build pages & components';

  insert into public.projects (organization_id, name, client_id, service_id, description, start_date, due_date,
                               priority, status, project_manager_id, created_by)
  values (v_org, 'Globex Retail Dashboards', c_globex, s_bi, 'Power BI reporting for 40 stores.', current_date + 7,
          current_date + 42, 'medium', 'planning', u_pm, u_owner)
  returning id into p_globex;
  insert into public.project_finances (project_id, organization_id, budget_cents) values (p_globex, v_org, 570000);
  insert into public.project_members (project_id, profile_id, role, added_by) values (p_globex, u_dev, 'BI developer', u_pm);
  perform public.apply_project_template(p_globex, tpl_bi, current_date + 7);

  insert into public.projects (organization_id, name, client_id, service_id, description,
                               start_date, due_date, status, project_manager_id, created_by)
  values (v_org, 'Acme Brand Refresh', c_acme, s_brand, 'Logo and brand guideline refresh.',
          current_date - 120, current_date - 80, 'completed', u_pm, u_owner)
  returning id into p_old;
  insert into public.project_finances (project_id, organization_id, budget_cents, contract_value_cents) values (p_old, v_org, 300000, 300000);

  -- Deliverable awaiting client review ----------------------------------------
  insert into public.files (organization_id, bucket, path, name, mime_type, size_bytes, category, visibility, project_id, client_id, uploaded_by)
  values (v_org, 'project-files', v_org || '/' || p_acme || '/seed-homepage-design.pdf', 'Homepage design v2.pdf', 'application/pdf',
          248000, 'deliverable', 'client', p_acme, c_acme, u_design)
  returning id into f1;
  insert into public.deliverables (organization_id, project_id, milestone_id, title, description, status, current_version, created_by)
  values (v_org, p_acme, (select id from public.milestones where project_id = p_acme and title = 'UI/UX design'),
          'Homepage & inner page designs', 'High-fidelity designs for review.', 'draft', 1, u_design)
  returning id into d1;
  insert into public.deliverable_versions (deliverable_id, version, file_id, notes, created_by)
  values (d1, 1, f1, 'Incorporates feedback from the kickoff workshop.', u_design);
  update public.deliverables set status = 'submitted', submitted_at = now() - interval '1 day' where id = d1;

  -- Invoices & payments --------------------------------------------------------
  insert into public.invoices (organization_id, client_id, project_id, proposal_id, issue_date, due_date, status, tax_rate_bps, payment_terms, created_by)
  values (v_org, c_acme, p_acme, pr_acme, current_date - 45, current_date - 31, 'draft', 500, '40% deposit', u_fin) returning id into inv1;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price_cents) values (inv1, '40% deposit — Acme corporate website', 1, 371200);
  update public.invoices set status = 'sent' where id = inv1;
  insert into public.payments (organization_id, invoice_id, client_id, amount_cents, payment_date, method, reference, recorded_by)
  values (v_org, inv1, c_acme, 389760, current_date - 35, 'bank_transfer', 'ACME-TT-0091', u_fin);

  insert into public.invoices (organization_id, client_id, project_id, issue_date, due_date, status, tax_rate_bps, created_by)
  values (v_org, c_acme, p_acme, current_date - 5, current_date + 9, 'draft', 500, u_fin) returning id into inv2;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price_cents) values (inv2, '40% at design approval — Acme corporate website', 1, 371200);
  update public.invoices set status = 'sent' where id = inv2;
  insert into public.payments (organization_id, invoice_id, client_id, amount_cents, payment_date, method, reference, recorded_by)
  values (v_org, inv2, c_acme, 150000, current_date - 2, 'card', 'ch_test_1', u_fin);

  insert into public.invoices (organization_id, client_id, project_id, issue_date, due_date, status, created_by)
  values (v_org, c_acme, p_old, current_date - 100, current_date - 86, 'draft', u_fin) returning id into inv3;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price_cents) values (inv3, 'Brand refresh', 1, 300000);
  update public.invoices set status = 'sent' where id = inv3;
  insert into public.payments (organization_id, invoice_id, client_id, amount_cents, payment_date, method, reference, recorded_by)
  values (v_org, inv3, c_acme, 300000, current_date - 90, 'bank_transfer', 'ACME-TT-0042', u_fin);

  insert into public.invoices (organization_id, client_id, issue_date, due_date, status, created_by, notes)
  values (v_org, c_globex, current_date - 40, current_date - 10, 'draft', u_fin, 'Discovery workshop') returning id into inv3;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price_cents) values (inv3, 'Data discovery workshop', 1, 120000);
  update public.invoices set status = 'sent' where id = inv3;

  -- Expenses -------------------------------------------------------------------
  insert into public.expenses (organization_id, category, description, amount_cents, expense_date, vendor, project_id, created_by) values
    (v_org, 'software', 'Figma Professional', 4500, current_date - 20, 'Figma', null, u_fin),
    (v_org, 'hosting', 'Vercel Pro', 2000, current_date - 18, 'Vercel', p_acme, u_fin),
    (v_org, 'contractor', 'Copywriting', 60000, current_date - 25, 'Freelance writer', p_acme, u_fin),
    (v_org, 'marketing', 'LinkedIn ads', 35000, current_date - 50, 'LinkedIn', null, u_fin),
    (v_org, 'software', 'Power BI Pro licences', 3000, current_date - 70, 'Microsoft', null, u_fin);

  -- Conversation ---------------------------------------------------------------
  select id into conv from public.conversations where project_id = p_acme and subject = 'Project discussion';
  insert into public.messages (organization_id, conversation_id, author_id, body, created_at) values
    (v_org, conv, u_pm, 'Hi John — the homepage designs are ready for your review in the Deliverables tab.', now() - interval '1 day'),
    (v_org, conv, u_acme, 'Thanks Yusuf, I will review them with the team tomorrow.', now() - interval '20 hours');

  -- keep the local outbox quiet: seed-time emails are not useful
  delete from public.email_outbox;
end $$;

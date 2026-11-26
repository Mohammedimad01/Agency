-- =============================================================================
-- SERVICE CATALOGUE v2: Websites · Custom apps & software · SEO & growth · More
-- Installs/updates the default catalogue for every organization (idempotent).
-- Existing descriptions, prices and deliverables edited by the agency are kept.
-- Services from the previous catalogue that overlap are hidden, not deleted,
-- so leads, projects and proposals that reference them stay intact.
-- =============================================================================
create or replace function private.install_default_services(p_org uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.services (organization_id, slug, name, category, icon, summary, description, delivery_time, deliverables, sort_order, is_active, is_public)
  select p_org, v.slug, v.name, v.category, v.icon, v.summary, v.description, v.delivery_time, v.deliverables, v.sort_order, true, true
  from (values
    ('website-development','Web development','Websites','globe','Fast, SEO-ready business sites','High-performance business websites built on a modern stack: fast on every device, structured for search engines from day one, and easy for your team to update.','3–6 weeks',array['Responsive website','CMS your team can edit','On-page SEO foundation','Analytics & Search Console','Launch support'],1),
    ('web-design','Web design','Websites','palette','Clean, conversion-focused design','Distinctive, on-brand website design that guides visitors to act: clear messaging, strong hierarchy and calls to action that convert.','2–4 weeks',array['Sitemap & wireframes','Visual design system','Responsive page designs','Conversion-focused copy structure','Developer-ready handoff'],2),
    ('ecommerce','E-commerce','Websites','shopping-cart','Online stores that sell','Online stores that load fast, rank well and make buying effortless — with payments, shipping, inventory and analytics set up properly.','4–8 weeks',array['Store design & build','Payment & shipping setup','Product catalogue import','Conversion tracking','Training & launch'],3),
    ('ui-ux-design','UI/UX design','Websites','pen-tool','Interfaces people understand','Research-led product and interface design: user flows, wireframes, prototypes and design systems that make complex software feel simple.','3–6 weeks',array['User research & flows','Wireframes','High-fidelity UI','Interactive prototype','Design system'],4),
    ('custom-web-apps','Custom web apps','Custom apps & software','app-window','Portals, dashboards, tools','Secure web applications built around your process — client portals, internal dashboards and tools that replace spreadsheets and manual work.','6–14 weeks',array['Product specification','Web application','Admin panel','Automated tests','Deployment & handover'],5),
    ('mobile-apps','Mobile apps','Custom apps & software','smartphone','iOS and Android','Cross-platform mobile apps for iOS and Android with a single codebase, offline support and App Store / Play Store publishing.','8–16 weeks',array['App design','iOS & Android apps','Backend & API','Store publishing','Analytics & crash reporting'],6),
    ('business-software','Business software','Custom apps & software','briefcase','Built around your workflow','Custom business systems for operations, sales, HR or logistics — built around how your team actually works, not the other way round.','Scoped per project',array['Process discovery','System architecture','Custom software','Integrations','Training & support'],7),
    ('invoicing-apps','Invoicing apps','Custom apps & software','receipt-text','VAT-ready, branded PDFs','Invoicing software with VAT-compliant numbering, branded PDF invoices, payment tracking and reminders — tailored to your business.','3–6 weeks',array['VAT-ready invoicing','Branded PDF templates','Payment tracking','Automated reminders','Reports & exports'],8),
    ('quotation-apps','Quotation apps','Custom apps & software','file-text','Quote to invoice in one flow','Create professional quotes in minutes, get them approved online and convert them to invoices in one click — no retyping.','3–6 weeks',array['Quote builder','Product & price catalogue','Online approval','Quote-to-invoice conversion','Sales reporting'],9),
    ('erp-software','ERP software','Custom apps & software','boxes','Operations in one system','One system for inventory, purchasing, sales, finance and people — replacing disconnected tools with a single source of truth.','12+ weeks',array['Requirements & process mapping','Core ERP modules','Data migration','Integrations','Rollout & training'],10),
    ('seo-services','SEO services','SEO & growth','search','Rank for the searches that pay','Strategy-led SEO that targets the searches your buyers actually make — keyword research, content, on-page optimisation and link building with monthly reporting.','Ongoing (monthly)',array['SEO audit & strategy','Keyword research','On-page optimisation','Content plan','Monthly reporting'],11),
    ('google-search-console','Google Search Console setup','SEO & growth','search-check','Get indexed and measured fast','Verification, sitemaps, indexing fixes and performance tracking in Google Search Console — so Google finds your site and you can measure results.','1 week',array['Property verification','Sitemap submission','Indexing issue fixes','Analytics integration','Performance baseline report'],12),
    ('technical-seo','Technical SEO','SEO & growth','gauge','Speed, schema, crawlability','Core Web Vitals, structured data, crawlability and site architecture fixes that remove the technical barriers between you and better rankings.','2–4 weeks',array['Technical audit','Core Web Vitals fixes','Schema markup','Crawl & index fixes','Re-audit report'],13),
    ('ai-search-optimization','AI search (GEO and AEO)','SEO & growth','sparkles','Be the answer, not just a link','Generative and answer engine optimisation so ChatGPT, Gemini, Perplexity and Google AI Overviews cite your business when customers ask.','Ongoing (monthly)',array['AI visibility audit','Entity & schema optimisation','Answer-first content','Citation building','AI search monitoring'],14),
    ('local-seo','Local SEO','SEO & growth','map-pin','Maps and near-me searches','Google Business Profile optimisation, local citations and reviews strategy so you show up in maps and near-me searches.','Ongoing (monthly)',array['Google Business Profile','Local citations','Review strategy','Location pages','Local rank tracking'],15),
    ('digital-marketing','Digital marketing','SEO & growth','megaphone','Search, social and ads','Performance marketing across Google Ads, Meta and LinkedIn — planned, launched and optimised against real revenue, not vanity metrics.','Ongoing (monthly)',array['Channel strategy','Campaign setup','Ad creative','Conversion tracking','Monthly optimisation'],16),
    ('ai-automation','AI automation','More services','bot','Automate the busywork with AI','AI assistants and automated workflows that connect your tools and take repetitive work off your team — from lead handling to document processing.','2–8 weeks',array['Process discovery','AI workflow design','Integrations','Testing & guardrails','Monitoring'],17),
    ('power-bi','Power BI & analytics','More services','chart-pie','Dashboards your leadership will use','Power BI dashboards and data models that turn scattered data into one trusted view of the business, refreshed automatically.','2–6 weeks',array['Requirements workshop','Data model','Dashboards','Automated refresh','Handover'],18),
    ('branding','Branding','More services','sparkles','Identities with clarity and character','Brand strategy, logo and identity systems with guidelines your team and partners can apply consistently.','3–5 weeks',array['Brand strategy','Logo suite','Colour & typography','Brand guidelines','Asset kit'],19),
    ('website-maintenance','Website maintenance','More services','wrench','Updates, backups, monitoring','Ongoing care for your website: updates, security patches, backups, uptime monitoring and small improvements every month.','Monthly plan',array['Updates & patches','Daily backups','Uptime monitoring','Monthly improvements','Priority support'],20),
    ('hosting-infrastructure','Hosting and infrastructure','More services','server','Fast, secure, managed hosting','Managed cloud hosting, domains, SSL, CDN and email deliverability — configured for speed and security, monitored around the clock.','1 week setup',array['Cloud hosting setup','Domain & DNS','SSL & CDN','Email deliverability','Monitoring & alerts'],21)
  ) as v(slug, name, category, icon, summary, description, delivery_time, deliverables, sort_order)
  on conflict (organization_id, slug) do update set
    name = excluded.name, category = excluded.category, icon = excluded.icon, summary = excluded.summary,
    sort_order = excluded.sort_order, is_active = true, is_public = true,
    description = coalesce(public.services.description, excluded.description),
    delivery_time = coalesce(public.services.delivery_time, excluded.delivery_time),
    deliverables = case when cardinality(public.services.deliverables) > 0 then public.services.deliverables else excluded.deliverables end;

  update public.services set is_public = false, is_active = false
  where organization_id = p_org
    and slug in ('web-applications','business-intelligence','ai-solutions','automation-integrations','custom-software');
end $$;
revoke all on function private.install_default_services(uuid) from public, anon, authenticated;

do $$
declare r record;
begin
  for r in select id from public.organizations loop
    perform private.install_default_services(r.id);
  end loop;
end $$;

-- New workspaces get the v2 catalogue.
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

  perform private.install_default_services(v_org);

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

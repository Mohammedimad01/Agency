-- =============================================================================
-- STORAGE
-- Private buckets: every read/write is brokered by the server, which checks the
-- caller's access to the matching public.files row (RLS / portal views) and then
-- issues short-lived signed URLs. Direct object access is limited to team
-- members of the organization that owns the folder ({organization_id}/...).
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('project-files', 'project-files', false, 52428800, array[
    'image/png','image/jpeg','image/webp','image/gif','image/svg+xml','application/pdf',
    'application/zip','application/x-zip-compressed','text/plain','text/csv','text/markdown',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4','video/quicktime','application/json','application/figma']),
  ('finance-files', 'finance-files', false, 20971520, array['image/png','image/jpeg','image/webp','application/pdf']),
  ('public-assets', 'public-assets', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.storage_org(p_name text)
returns uuid language sql immutable set search_path = '' as $$
  select case when (storage.foldername(p_name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(p_name))[1])::uuid end;
$$;
grant execute on function private.storage_org(text) to authenticated;

create policy "project-files: team read" on storage.objects for select to authenticated
  using (bucket_id = 'project-files' and public.is_org_member(private.storage_org(name)));
create policy "project-files: team write" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-files' and public.is_org_member(private.storage_org(name)));
create policy "project-files: team delete" on storage.objects for delete to authenticated
  using (bucket_id = 'project-files' and public.has_permission(private.storage_org(name), 'projects.manage'));

create policy "finance-files: finance read" on storage.objects for select to authenticated
  using (bucket_id = 'finance-files' and (public.has_permission(private.storage_org(name), 'finance.view')
                                          or public.has_permission(private.storage_org(name), 'contracts.view')));
create policy "finance-files: finance write" on storage.objects for insert to authenticated
  with check (bucket_id = 'finance-files' and (public.has_permission(private.storage_org(name), 'finance.manage')
                                               or public.has_permission(private.storage_org(name), 'contracts.manage')));

create policy "public-assets: read" on storage.objects for select to anon, authenticated using (bucket_id = 'public-assets');
create policy "public-assets: content write" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-assets' and public.has_permission(private.storage_org(name), 'content.manage'));
create policy "public-assets: content delete" on storage.objects for delete to authenticated
  using (bucket_id = 'public-assets' and public.has_permission(private.storage_org(name), 'content.manage'));

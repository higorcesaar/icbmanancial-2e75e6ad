
INSERT INTO storage.buckets (id, name, public) VALUES ('members', 'members', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "members_bucket_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'members');

CREATE POLICY "members_bucket_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "members_bucket_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "members_bucket_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE POLICY "Authenticated read outfit files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'outfits');
CREATE POLICY "Admins upload outfit files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'outfits' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update outfit files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'outfits' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'outfits' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete outfit files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'outfits' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read member files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'members');
CREATE POLICY "Admins upload member files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update member files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete member files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'members' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone uploads access requests" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'access-requests');
CREATE POLICY "Admins read access requests" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'access-requests' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete access requests" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'access-requests' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read video files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'videos');
CREATE POLICY "Admins upload video files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update video files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete video files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));
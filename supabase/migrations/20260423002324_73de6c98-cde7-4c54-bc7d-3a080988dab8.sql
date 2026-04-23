-- Tighten SELECT on access-requests bucket: only admins can LIST,
-- but files remain publicly accessible via direct URL (bucket is public).
DROP POLICY IF EXISTS "Access request photos publicly readable" ON storage.objects;

CREATE POLICY "Admins can list access request photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'access-requests' AND has_role(auth.uid(), 'admin'));
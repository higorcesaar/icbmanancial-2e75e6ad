-- Make videos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'videos';

-- Drop any existing public-read policy if present (defensive)
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;

-- Authenticated users can read videos (for signed URLs / direct access)
CREATE POLICY "Authenticated users can view videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'videos');

-- Only admins can upload
DROP POLICY IF EXISTS "Admins can upload videos" ON storage.objects;
CREATE POLICY "Admins can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update
DROP POLICY IF EXISTS "Admins can update videos" ON storage.objects;
CREATE POLICY "Admins can update videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
DROP POLICY IF EXISTS "Admins can delete videos" ON storage.objects;
CREATE POLICY "Admins can delete videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));
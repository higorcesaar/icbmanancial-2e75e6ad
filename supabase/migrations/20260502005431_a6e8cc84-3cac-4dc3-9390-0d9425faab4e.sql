-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_select_admin_ministra"
ON public.videos FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = ANY (ARRAY['admin'::app_role, 'ministra'::app_role])));

CREATE POLICY "videos_admin_write"
ON public.videos FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_videos_position ON public.videos(position);

-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 524288000, ARRAY['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/ogg']);

-- Storage policies
CREATE POLICY "Videos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Admins can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos' AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE POLICY "Admins can update videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos' AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE POLICY "Admins can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));
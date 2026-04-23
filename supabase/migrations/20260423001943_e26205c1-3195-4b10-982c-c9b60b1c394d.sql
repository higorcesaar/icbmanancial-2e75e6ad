-- Add status column to profiles for pending approval flow
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS request_photo_url TEXT;

-- Existing users stay approved; new self-signups will be 'pending'
-- Update handle_new_user to set status based on metadata flag
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_request boolean;
  photo text;
BEGIN
  is_request := COALESCE((NEW.raw_user_meta_data->>'access_request')::boolean, false);
  photo := NEW.raw_user_meta_data->>'request_photo_url';

  INSERT INTO public.profiles (user_id, email, display_name, status, request_photo_url, is_active)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    CASE WHEN is_request THEN 'pending' ELSE 'approved' END,
    photo,
    CASE WHEN is_request THEN false ELSE true END
  );

  IF NOT is_request THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'ministra')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Public storage bucket for access-request photos (uploaded by anon during signup)
INSERT INTO storage.buckets (id, name, public)
VALUES ('access-requests', 'access-requests', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload to access-requests bucket (used during public signup form)
CREATE POLICY "Anyone can upload access request photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'access-requests');

CREATE POLICY "Access request photos publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'access-requests');

CREATE POLICY "Admins can delete access request photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'access-requests' AND has_role(auth.uid(), 'admin'));
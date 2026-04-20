-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger function (reusable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'ministra')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add missing RLS policies for write operations on existing tables
CREATE POLICY "Authenticated can insert members" ON public.members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update members" ON public.members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete members" ON public.members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can insert outfits" ON public.outfits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update outfits" ON public.outfits FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete outfits" ON public.outfits FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can view accessories" ON public.accessories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert accessories" ON public.accessories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update accessories" ON public.accessories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete accessories" ON public.accessories FOR DELETE TO authenticated USING (true);
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert schedules" ON public.schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update schedules" ON public.schedules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete schedules" ON public.schedules FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can view schedule_members" ON public.schedule_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert schedule_members" ON public.schedule_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete schedule_members" ON public.schedule_members FOR DELETE TO authenticated USING (true);
ALTER TABLE public.schedule_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view schedule_outfits" ON public.schedule_outfits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert schedule_outfits" ON public.schedule_outfits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete schedule_outfits" ON public.schedule_outfits FOR DELETE TO authenticated USING (true);
ALTER TABLE public.schedule_outfits ENABLE ROW LEVEL SECURITY;

-- user_roles read policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Storage policies for outfits bucket (public read + authenticated write)
CREATE POLICY "Public can view outfit images" ON storage.objects FOR SELECT USING (bucket_id = 'outfits');
CREATE POLICY "Authenticated can upload outfit images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'outfits');
CREATE POLICY "Authenticated can update outfit images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'outfits');
CREATE POLICY "Authenticated can delete outfit images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'outfits');
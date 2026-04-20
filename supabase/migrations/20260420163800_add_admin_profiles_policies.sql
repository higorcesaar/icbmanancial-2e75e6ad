-- Add admin can update any profile (run AFTER has_role function exists)
DO $$
BEGIN
  -- Only create if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Admins can update any profile' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admins can update any profile"
      ON public.profiles FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;

-- Add admin can delete any profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Admins can delete any profile' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY "Admins can delete any profile"
      ON public.profiles FOR DELETE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;
-- Secure RLS policies enforcing ownership and role-based access

-- Members: anyone authenticated can read, only admin can modify
DROP POLICY IF EXISTS "Members are viewable by authenticated" ON public.members;
CREATE POLICY "Members are viewable by authenticated"
  ON public.members FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert members" ON public.members;
CREATE POLICY "Admins can insert members" ON public.members FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update members" ON public.members;
CREATE POLICY "Admins can update members" ON public.members FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete members" ON public.members;
CREATE POLICY "Admins can delete members" ON public.members FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Outfits: anyone authenticated can read, only admin can modify
DROP POLICY IF EXISTS "Outfits are viewable by authenticated" ON public.outfits;
CREATE POLICY "Outfits are viewable by authenticated"
  ON public.outfits FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert outfits" ON public.outfits;
CREATE POLICY "Admins can insert outfits" ON public.outfits FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update outfits" ON public.outfits;
CREATE POLICY "Admins can update outfits" ON public.outfits FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete outfits" ON public.outfits;
CREATE POLICY "Admins can delete outfits" ON public.outfits FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Accessories: anyone authenticated can read, only admin can modify
DROP POLICY IF EXISTS "Accessories are viewable by authenticated" ON public.accessories;
CREATE POLICY "Accessories are viewable by authenticated"
  ON public.accessories FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert accessories" ON public.accessories;
CREATE POLICY "Admins can insert accessories" ON public.accessories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update accessories" ON public.accessories;
CREATE POLICY "Admins can update accessories" ON public.accessories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete accessories" ON public.accessories;
CREATE POLICY "Admins can delete accessories" ON public.accessories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Schedules: authenticated can read all, only admin can modify
DROP POLICY IF EXISTS "Schedules are viewable by authenticated" ON public.schedules;
CREATE POLICY "Schedules are viewable by authenticated"
  ON public.schedules FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert schedules" ON public.schedules;
CREATE POLICY "Admins can insert schedules" ON public.schedules FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update schedules" ON public.schedules;
CREATE POLICY "Admins can update schedules" ON public.schedules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete schedules" ON public.schedules;
CREATE POLICY "Admins can delete schedules" ON public.schedules FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Junction tables: only admin can modify
DROP POLICY IF EXISTS "Schedule members modifiable by admin" ON public.schedule_members;
CREATE POLICY "Schedule members modifiable by admin" ON public.schedule_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Schedule outfits modifiable by admin" ON public.schedule_outfits;
CREATE POLICY "Schedule outfits modifiable by admin" ON public.schedule_outfits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Schedule accessories modifiable by admin" ON public.schedule_accessories;
CREATE POLICY "Schedule accessories modifiable by admin" ON public.schedule_accessories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
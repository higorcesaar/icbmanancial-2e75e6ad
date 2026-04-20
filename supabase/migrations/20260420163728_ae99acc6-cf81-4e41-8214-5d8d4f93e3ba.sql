-- schedule_accessories junction table
CREATE TABLE public.schedule_accessories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  accessory_id uuid NOT NULL REFERENCES public.accessories(id) ON DELETE CASCADE,
  UNIQUE (schedule_id, accessory_id)
);

ALTER TABLE public.schedule_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view schedule_accessories"
  ON public.schedule_accessories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert schedule_accessories"
  ON public.schedule_accessories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete schedule_accessories"
  ON public.schedule_accessories FOR DELETE TO authenticated USING (true);

-- profiles.is_active
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
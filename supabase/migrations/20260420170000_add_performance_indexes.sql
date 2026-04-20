-- Performance indexes for frequently queried columns
-- schedules.date - used for calendar queries
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(date);

-- schedule_members foreign keys - used for joins
CREATE INDEX IF NOT EXISTS idx_schedule_members_schedule_id ON public.schedule_members(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_members_member_id ON public.schedule_members(member_id);

-- schedule_outfits foreign keys
CREATE INDEX IF NOT EXISTS idx_schedule_outfits_schedule_id ON public.schedule_outfits(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_outfits_outfit_id ON public.schedule_outfits(outfit_id);

-- schedule_accessories foreign keys
CREATE INDEX IF NOT EXISTS idx_schedule_accessories_schedule_id ON public.schedule_accessories(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_accessories_accessory_id ON public.schedule_accessories(accessory_id);

-- user_roles foreign key - used for auth lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- members status - used for filtering active/inactive
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
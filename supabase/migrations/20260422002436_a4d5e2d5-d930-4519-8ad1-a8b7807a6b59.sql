ALTER TABLE public.outfits
  ADD COLUMN IF NOT EXISTS image_front_url text,
  ADD COLUMN IF NOT EXISTS image_back_url text;
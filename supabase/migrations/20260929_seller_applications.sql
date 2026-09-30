-- Seller applications need a reviewable shop profile before role promotion.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_status TEXT,
  ADD COLUMN IF NOT EXISTS shop_name TEXT,
  ADD COLUMN IF NOT EXISTS shop_description TEXT,
  ADD COLUMN IF NOT EXISTS shop_address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS shop_image_url TEXT;

-- =========================================================
-- Fix profiles table schema to match current database
-- Add missing fields for professional sellers
-- =========================================================

-- Drop existing enum and recreate with 'regular' instead of 'user'
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('regular', 'seller', 'admin');

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS cnic TEXT;

-- Update the role column to use the new enum with 'regular' as default
ALTER TABLE public.profiles 
  ALTER COLUMN role TYPE public.app_role USING role::TEXT::public.app_role,
  ALTER COLUMN role SET DEFAULT 'regular';

-- Update existing 'user' roles to 'regular'
UPDATE public.profiles SET role = 'regular' WHERE role::TEXT = 'user';

-- Update the trigger function to handle new fields and role properly
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    email,
    phone,
    full_name,
    cnic,
    role
  )
  VALUES (
    new.id, 
    COALESCE(NULLIF(new.raw_user_meta_data ->> 'username', ''), SPLIT_PART(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'cnic',
    CASE 
      WHEN new.raw_user_meta_data ->> 'account_type' = 'seller' THEN 'seller'::public.app_role
      ELSE 'regular'::public.app_role
    END
  );
  RETURN new;
END;
$$;

-- Update the upgrade function to use 'regular' instead of 'user'
CREATE OR REPLACE FUNCTION public.upgrade_to_seller() 
RETURNS public.profiles
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  result public.profiles;
BEGIN
  UPDATE public.profiles 
  SET role = 'seller', updated_at = now()
  WHERE id = auth.uid() AND role = 'regular' 
  RETURNING * INTO result;
  
  IF result.id IS NULL THEN 
    SELECT * INTO result FROM public.profiles WHERE id = auth.uid(); 
  END IF;
  
  RETURN result;
END;
$$;

-- Update the assert_can_create_ad function to use 'regular' instead of 'user'
CREATE OR REPLACE FUNCTION public.assert_can_create_ad(p_user_id uuid) 
RETURNS VOID
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  current_role public.app_role; 
  ad_count integer;
BEGIN
  IF auth.uid() <> p_user_id AND NOT public.is_admin() THEN 
    RAISE EXCEPTION 'not authorized'; 
  END IF;
  
  SELECT role INTO current_role FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  SELECT count(*) INTO ad_count FROM public.cars WHERE "sellerId" = p_user_id::text;
  
  IF current_role = 'regular' AND ad_count >= 3 THEN
    RAISE EXCEPTION 'AD_LIMIT_REACHED: Upgrade to Seller to post more than 3 ads';
  END IF;
END;
$$;

-- Update policies to work with 'regular' role
DROP POLICY IF EXISTS "owners read ads" ON public.cars;
DROP POLICY IF EXISTS "owners update ads" ON public.cars;
DROP POLICY IF EXISTS "owners delete ads" ON public.cars;

CREATE POLICY "owners read ads" ON public.cars FOR SELECT
USING ("sellerId" = auth.uid()::text OR public.is_admin());

CREATE POLICY "owners update ads" ON public.cars FOR UPDATE
USING ("sellerId" = auth.uid()::text OR public.is_admin())
WITH CHECK ("sellerId" = auth.uid()::text OR public.is_admin());

CREATE POLICY "owners delete ads" ON public.cars FOR DELETE
USING ("sellerId" = auth.uid()::text OR public.is_admin());
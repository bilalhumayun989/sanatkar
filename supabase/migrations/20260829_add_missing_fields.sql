-- =========================================================
-- Add missing fields to profiles table to match our application
-- =========================================================

-- Add missing full_name column
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Make sure all required columns exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS cnic TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update the role column to use TEXT type instead of enum for simplicity
ALTER TABLE public.profiles 
  ALTER COLUMN role TYPE TEXT,
  ALTER COLUMN role SET DEFAULT 'regular';

-- Recreate the trigger function to properly insert data
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
    role,
    email_verified
  )
  VALUES (
    new.id, 
    COALESCE(NULLIF(new.raw_user_meta_data ->> 'username', ''), SPLIT_PART(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'cnic',
    CASE 
      WHEN new.raw_user_meta_data ->> 'account_type' = 'seller' THEN 'seller'
      ELSE 'regular'
    END,
    CASE 
      WHEN new.email_confirmed_at IS NOT NULL THEN TRUE
      ELSE FALSE
    END
  );
  RETURN new;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();
-- =========================================================
-- QUICK FIX: Run this directly in Supabase SQL Editor
-- This will add missing fields and fix the trigger
-- =========================================================

-- Step 1: Add missing full_name column
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Step 2: Make sure phone and cnic columns exist and are correct type
ALTER TABLE public.profiles 
  ALTER COLUMN phone TYPE TEXT,
  ALTER COLUMN cnic TYPE TEXT;

-- Step 3: Fix the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  -- Debug: Log the metadata being processed
  RAISE LOG 'Creating profile for user %, metadata: %', new.id, new.raw_user_meta_data;
  
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
  
  -- Debug: Log what was inserted
  RAISE LOG 'Profile created with role: %, phone: %, full_name: %, cnic: %', 
    CASE WHEN new.raw_user_meta_data ->> 'account_type' = 'seller' THEN 'seller' ELSE 'regular' END,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'cnic';
    
  RETURN new;
END;
$$;

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Verify the structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
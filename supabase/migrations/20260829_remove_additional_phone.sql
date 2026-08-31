-- =========================================================
-- Remove additional_phone column as it's no longer required
-- for seller accounts
-- =========================================================

-- Drop the additional_phone column from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS additional_phone;

-- Update any existing references that might still use additional_phone
-- (This is just a safety measure in case any functions reference it)
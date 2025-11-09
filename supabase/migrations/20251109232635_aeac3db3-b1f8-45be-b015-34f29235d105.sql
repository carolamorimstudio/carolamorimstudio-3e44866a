-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update trigger to populate email from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with email
  INSERT INTO public.profiles (user_id, name, email, is_public)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    false
  );
  
  -- Insert private data with phone
  INSERT INTO public.profiles_private (user_id, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Assign client role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with emails from auth.users (this will be done by admin manually if needed)
-- Admin can run this query in SQL editor if needed:
-- UPDATE public.profiles p SET email = au.email FROM auth.users au WHERE p.user_id = au.id AND p.email IS NULL;
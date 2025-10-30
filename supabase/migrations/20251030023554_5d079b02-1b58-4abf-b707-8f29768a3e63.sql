-- Fix search_path for security - use CREATE OR REPLACE instead of DROP
CREATE OR REPLACE FUNCTION update_profiles_private_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update handle_new_user to use profiles_private for phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile without phone
  INSERT INTO public.profiles (user_id, name, is_public)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
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
-- Add foreign key constraints with CASCADE delete for profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraints with CASCADE delete for profiles_private table
ALTER TABLE public.profiles_private
DROP CONSTRAINT IF EXISTS profiles_private_user_id_fkey;

ALTER TABLE public.profiles_private
ADD CONSTRAINT profiles_private_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraints with CASCADE delete for appointments table
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraints with CASCADE delete for user_roles table
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;
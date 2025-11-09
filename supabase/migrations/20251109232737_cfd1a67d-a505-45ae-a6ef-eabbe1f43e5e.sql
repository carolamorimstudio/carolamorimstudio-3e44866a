-- Backfill existing profiles with emails from auth.users
UPDATE public.profiles p 
SET email = au.email 
FROM auth.users au 
WHERE p.user_id = au.id 
  AND (p.email IS NULL OR p.email = '');
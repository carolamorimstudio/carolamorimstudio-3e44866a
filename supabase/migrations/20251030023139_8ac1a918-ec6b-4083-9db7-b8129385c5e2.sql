-- Create private data table for sensitive information
CREATE TABLE public.profiles_private (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on profiles_private
ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

-- Add visibility control to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Migrate existing phone data to private table
INSERT INTO public.profiles_private (user_id, phone)
SELECT user_id, phone 
FROM public.profiles 
WHERE phone IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone;

-- Remove phone from public profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- Create strict RLS policies for profiles_private
-- Only the owner can view their private data
CREATE POLICY "Users can view only their own private data"
ON public.profiles_private
FOR SELECT
USING (auth.uid() = user_id);

-- Only the owner can insert their private data
CREATE POLICY "Users can insert only their own private data"
ON public.profiles_private
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their private data
CREATE POLICY "Users can update only their own private data"
ON public.profiles_private
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all private data for support purposes
CREATE POLICY "Admins can view all private data"
ON public.profiles_private
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete private data
CREATE POLICY "Admins can delete private data"
ON public.profiles_private
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update profiles SELECT policy to respect visibility
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (is_public = true AND auth.role() = 'authenticated');

-- Add trigger for updated_at on profiles_private
CREATE OR REPLACE FUNCTION update_profiles_private_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_private_updated_at
BEFORE UPDATE ON public.profiles_private
FOR EACH ROW
EXECUTE FUNCTION update_profiles_private_updated_at();

-- Add comment explaining the security model
COMMENT ON TABLE public.profiles_private IS 'Stores sensitive user data with strict RLS policies. Only accessible by the owner and admins.';
COMMENT ON COLUMN public.profiles.is_public IS 'Controls whether profile name is visible to other authenticated users. Phone numbers are never public.';
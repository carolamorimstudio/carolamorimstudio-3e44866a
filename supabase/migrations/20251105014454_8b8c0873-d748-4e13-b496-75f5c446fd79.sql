-- Create storage buckets for logo and gallery
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logo', 'logo', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true);

-- Create gallery table
CREATE TABLE public.gallery (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  title text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on gallery
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- RLS policies for gallery
CREATE POLICY "Anyone can view gallery images"
ON public.gallery
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert gallery images"
ON public.gallery
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update gallery images"
ON public.gallery
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gallery images"
ON public.gallery
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for logo bucket
CREATE POLICY "Logo is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logo');

CREATE POLICY "Admins can upload logo"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'logo' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Admins can update logo"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'logo' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Admins can delete logo"
ON storage.objects
FOR DELETE
USING (bucket_id = 'logo' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));

-- Storage policies for gallery bucket
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Admins can update gallery images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'gallery' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Admins can delete gallery images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'gallery' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));
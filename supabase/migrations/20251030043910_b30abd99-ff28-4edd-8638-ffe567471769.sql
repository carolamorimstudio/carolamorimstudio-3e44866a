-- Allow clients to delete their own appointments
-- This is necessary for the cancel functionality to work properly

CREATE POLICY "Users can delete their own appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (auth.uid() = client_id);
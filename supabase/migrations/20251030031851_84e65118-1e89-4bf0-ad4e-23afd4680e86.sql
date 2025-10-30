-- Create table to track sent notifications
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('client_reminder', 'admin_notification')),
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all notifications
CREATE POLICY "Admins can view all email notifications"
ON public.email_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert notifications (function will use service role)
CREATE POLICY "Service role can insert email notifications"
ON public.email_notifications
FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_email_notifications_appointment_id ON public.email_notifications(appointment_id);
CREATE INDEX idx_email_notifications_sent_at ON public.email_notifications(sent_at DESC);
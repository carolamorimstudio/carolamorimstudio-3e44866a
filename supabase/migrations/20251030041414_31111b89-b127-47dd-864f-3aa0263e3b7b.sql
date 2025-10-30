-- Fix existing inconsistent time_slots
-- Set status to 'booked' for time_slots that have active appointments
UPDATE public.time_slots
SET status = 'booked'
WHERE id IN (
  SELECT DISTINCT time_slot_id 
  FROM public.appointments 
  WHERE status = 'active'
) AND status = 'available';

-- Create function to sync time_slot status when appointment changes
CREATE OR REPLACE FUNCTION public.sync_time_slot_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When appointment is created or reactivated
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active')) THEN
    UPDATE public.time_slots
    SET status = 'booked'
    WHERE id = NEW.time_slot_id;
    
  -- When appointment is cancelled or deleted
  ELSIF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled')) THEN
    -- Only set to available if no other active appointments exist for this slot
    UPDATE public.time_slots
    SET status = 'available'
    WHERE id = COALESCE(NEW.time_slot_id, OLD.time_slot_id)
    AND NOT EXISTS (
      SELECT 1 
      FROM public.appointments 
      WHERE time_slot_id = COALESCE(NEW.time_slot_id, OLD.time_slot_id)
      AND status = 'active'
      AND id != COALESCE(NEW.id, OLD.id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on appointments table
DROP TRIGGER IF EXISTS sync_time_slot_status_trigger ON public.appointments;
CREATE TRIGGER sync_time_slot_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_time_slot_status();
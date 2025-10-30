-- Add unique constraint to prevent multiple bookings of the same time slot

-- First, identify and delete duplicate appointments (keep only the oldest one by created_at)
DELETE FROM appointments a
USING appointments b
WHERE a.time_slot_id = b.time_slot_id
AND a.status = 'active'
AND b.status = 'active'
AND a.created_at > b.created_at;

-- Update time slots status based on whether they have active appointments
UPDATE time_slots
SET status = CASE 
  WHEN EXISTS (
    SELECT 1 FROM appointments 
    WHERE appointments.time_slot_id = time_slots.id 
    AND appointments.status = 'active'
  ) THEN 'booked'
  ELSE 'available'
END;

-- Add unique constraint to prevent duplicate bookings
CREATE UNIQUE INDEX unique_active_appointment_per_slot 
ON appointments(time_slot_id) 
WHERE status = 'active';

-- Add comment explaining the constraint
COMMENT ON INDEX unique_active_appointment_per_slot IS 'Ensures only one active appointment per time slot - prevents race conditions';

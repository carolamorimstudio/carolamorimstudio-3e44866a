import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting cleanup of past appointments...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date and time in ISO format
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    console.log(`📅 Current date: ${currentDate}, time: ${currentTime}`);

    // Find appointments with time slots that have already passed
    const { data: pastAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        time_slot_id,
        time_slots (
          date,
          time
        )
      `)
      .eq('status', 'active');

    if (fetchError) {
      console.error('❌ Error fetching appointments:', fetchError);
      throw fetchError;
    }

    if (!pastAppointments || pastAppointments.length === 0) {
      console.log('✅ No appointments to process');
      return new Response(
        JSON.stringify({ message: 'No appointments to cleanup', deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${pastAppointments.length} active appointments`);

    // Filter appointments that have passed
    const appointmentsToDelete = pastAppointments.filter((appointment: any) => {
      const slot = appointment.time_slots;
      if (!slot || !slot.date || !slot.time) return false;

      const slotDate = slot.date;
      const slotTime = slot.time.substring(0, 5); // HH:MM

      // Compare dates
      if (slotDate < currentDate) {
        return true; // Past date
      }
      
      if (slotDate === currentDate && slotTime < currentTime) {
        return true; // Same date but past time
      }

      return false;
    });

    console.log(`🗑️ Found ${appointmentsToDelete.length} appointments to delete`);

    if (appointmentsToDelete.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No past appointments found', deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete past appointments
    const appointmentIds = appointmentsToDelete.map((a: any) => a.id);
    
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .in('id', appointmentIds);

    if (deleteError) {
      console.error('❌ Error deleting appointments:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Successfully deleted ${appointmentIds.length} past appointments`);

    // The trigger will automatically update time_slots status to 'available'

    return new Response(
      JSON.stringify({
        message: 'Cleanup completed successfully',
        deleted: appointmentIds.length,
        appointments: appointmentsToDelete.map((a: any) => ({
          id: a.id,
          date: a.time_slots?.date,
          time: a.time_slots?.time
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in cleanup function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

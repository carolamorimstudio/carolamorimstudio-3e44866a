import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Checking appointments for notifications...");

    // Get current time and time in 1 hour
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    console.log("Time range:", {
      from: oneHourFromNow.toISOString(),
      to: twoHoursFromNow.toISOString()
    });

    // Get active appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        time_slot_id,
        client_id,
        service_id,
        status,
        time_slots!inner (
          date,
          time
        ),
        services!inner (
          name
        )
      `)
      .eq("status", "active");

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw appointmentsError;
    }

    console.log(`Found ${appointments?.length || 0} active appointments`);

    const notificationsSent = [];

    for (const appointment of appointments || []) {
      const timeSlot = Array.isArray(appointment.time_slots) ? appointment.time_slots[0] : appointment.time_slots;
      const service = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services;
      
      if (!timeSlot || !service) continue;

      // Combine date and time
      const appointmentDateTime = new Date(`${timeSlot.date}T${timeSlot.time}`);
      
      // Check if appointment is between 1 and 2 hours from now
      if (appointmentDateTime >= oneHourFromNow && appointmentDateTime <= twoHoursFromNow) {
        console.log(`Appointment ${appointment.id} is in range`);

        // Check if we already sent notifications for this appointment
        const { data: existingNotifications } = await supabase
          .from("email_notifications")
          .select("id")
          .eq("appointment_id", appointment.id)
          .eq("status", "sent");

        if (existingNotifications && existingNotifications.length > 0) {
          console.log(`Notifications already sent for appointment ${appointment.id}`);
          continue;
        }

        // Get client profile info
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", appointment.client_id)
          .single();

        // Get client private info (phone and email)
        const { data: privateData } = await supabase
          .from("profiles_private")
          .select("phone")
          .eq("user_id", appointment.client_id)
          .single();

        // Get client email from auth.users
        const { data: { user } } = await supabase.auth.admin.getUserById(appointment.client_id);

        if (!user?.email || !profile) {
          console.log(`Missing client data for appointment ${appointment.id}`);
          continue;
        }

        // Get admin email from site_settings
        const { data: adminEmailSetting } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "admin_email")
          .maybeSingle();

        const adminEmail = adminEmailSetting?.value || "contatocarolamorimstudio@gmail.com";

        // Format date and time
        const formattedDate = new Date(timeSlot.date).toLocaleDateString("pt-BR");
        const formattedTime = timeSlot.time.substring(0, 5); // HH:MM

        // Call send-appointment-emails function
        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-appointment-emails`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              appointmentId: appointment.id,
              clientName: profile.name,
              clientEmail: user.email,
              serviceName: service.name,
              appointmentDate: formattedDate,
              appointmentTime: formattedTime,
              clientPhone: privateData?.phone,
              adminEmail: adminEmail,
            }),
          }
        );

        if (emailResponse.ok) {
          notificationsSent.push(appointment.id);
          console.log(`Notifications sent for appointment ${appointment.id}`);
        } else {
          console.error(`Failed to send notifications for appointment ${appointment.id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        checked: appointments?.length || 0,
        notificationsSent: notificationsSent.length,
        appointmentIds: notificationsSent
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-appointments function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

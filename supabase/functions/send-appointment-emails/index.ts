import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  clientPhone?: string;
  adminEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { 
      appointmentId,
      clientName, 
      clientEmail, 
      serviceName, 
      appointmentDate, 
      appointmentTime,
      clientPhone,
      adminEmail 
    }: EmailRequest = await req.json();

    console.log("Sending emails for appointment:", appointmentId);

    // Send client reminder email
    const clientEmailResult = await resend.emails.send({
      from: "Carol Amorim Studio <contatocarolamorimstudio@gmail.com>",
      to: [clientEmail],
      subject: "Lembrete: Seu horário está próximo!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Olá ${clientName},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Passando para lembrar do seu horário marcado para as <strong>${appointmentTime}</strong>.
          </p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Serviço:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Data:</strong> ${appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>Horário:</strong> ${appointmentTime}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Espero você!
          </p>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">
            Carol Amorim Studio
          </p>
        </div>
      `,
    });

    console.log("Client email sent:", clientEmailResult);

    // Log client notification
    await supabase.from("email_notifications").insert({
      appointment_id: appointmentId,
      notification_type: "client_reminder",
      sent_to: clientEmail,
      status: clientEmailResult.error ? "failed" : "sent",
      error_message: clientEmailResult.error?.message || null,
    });

    // Send admin notification email
    const adminEmailResult = await resend.emails.send({
      from: "Carol Amorim Studio <contatocarolamorimstudio@gmail.com>",
      to: [adminEmail],
      subject: `Lembrete: Agendamento às ${appointmentTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Agendamento em 1 hora</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Informações do Cliente:</h3>
            <p style="margin: 5px 0;"><strong>Nome:</strong> ${clientName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${clientEmail}</p>
            ${clientPhone ? `<p style="margin: 5px 0;"><strong>Telefone:</strong> ${clientPhone}</p>` : ''}
            
            <h3 style="margin-top: 20px;">Informações do Serviço:</h3>
            <p style="margin: 5px 0;"><strong>Serviço:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Data:</strong> ${appointmentDate}</p>
            <p style="margin: 5px 0;"><strong>Horário:</strong> ${appointmentTime}</p>
          </div>
        </div>
      `,
    });

    console.log("Admin email sent:", adminEmailResult);

    // Log admin notification
    await supabase.from("email_notifications").insert({
      appointment_id: appointmentId,
      notification_type: "admin_notification",
      sent_to: adminEmail,
      status: adminEmailResult.error ? "failed" : "sent",
      error_message: adminEmailResult.error?.message || null,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        clientEmailSent: !clientEmailResult.error,
        adminEmailSent: !adminEmailResult.error
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-emails function:", error);
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

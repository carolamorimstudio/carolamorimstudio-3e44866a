import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateShort } from '@/lib/dateUtils';

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
}

interface TimeSlot {
  id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'available' | 'booked';
  services?: Service;
}

interface Appointment {
  id: string;
  client_id: string;
  service_id: string;
  time_slot_id: string;
  status: 'active' | 'cancelled';
  services?: Service;
  time_slots?: TimeSlot;
}

const Agendamentos = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && !isAdmin) {
      loadData();
    }
  }, [user, isAdmin]);

  // Set up realtime subscription for time slots and appointments
  useEffect(() => {
    if (!user || isAdmin) return;

    const timeSlotsChannel = supabase
      .channel('time-slots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_slots'
        },
        (payload) => {
          console.log('Time slot changed:', payload);
          loadTimeSlots();
        }
      )
      .subscribe();

    const appointmentsChannel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Appointment changed:', payload);
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(timeSlotsChannel);
      supabase.removeChannel(appointmentsChannel);
    };
  }, [user, isAdmin]);

  const loadData = async () => {
    try {
      setDataLoading(true);
      await Promise.all([
        loadServices(),
        loadTimeSlots(),
        loadAppointments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setDataLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadTimeSlots = async () => {
    try {
      // Get all time slots with available status
      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*, services(*)')
        .eq('status', 'available')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (slotsError) throw slotsError;

      // Get all active appointments to filter out booked slots
      const { data: activeAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('time_slot_id')
        .eq('status', 'active');

      if (appointmentsError) throw appointmentsError;

      // Create a Set of booked time slot IDs for fast lookup
      const bookedSlotIds = new Set(
        (activeAppointments || []).map(a => a.time_slot_id)
      );

      // Filter out slots that have active appointments
      const availableSlots = (slots || []).filter(
        slot => !bookedSlotIds.has(slot.id)
      );

      setAvailableSlots(availableSlots as TimeSlot[]);
    } catch (error) {
      console.error('Error loading time slots:', error);
    }
  };

  const loadAppointments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(*), time_slots(*)')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleBooking = async (slotId: string, serviceId: string) => {
    if (!user) return;
    
    try {
      // First, update time slot status to booked to prevent race conditions
      const { error: slotError } = await supabase
        .from('time_slots')
        .update({ status: 'booked' })
        .eq('id', slotId)
        .eq('status', 'available'); // Only update if still available

      if (slotError) {
        console.error('Error updating time slot:', slotError);
        throw new Error('Este horário não está mais disponível');
      }

      // Then create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: user.id,
          service_id: serviceId,
          time_slot_id: slotId,
          status: 'active'
        })
        .select('*, services(*), time_slots(*)')
        .single();

      if (appointmentError) {
        // Rollback time slot status if appointment creation fails
        await supabase
          .from('time_slots')
          .update({ status: 'available' })
          .eq('id', slotId);
        
        // Check if it's a duplicate appointment error
        if (appointmentError.message?.includes('unique_active_appointment_per_slot')) {
          throw new Error('Este horário acabou de ser agendado por outro cliente. Por favor, escolha outro horário.');
        }
        throw appointmentError;
      }

      // Remove from available slots and add to my appointments
      setAvailableSlots(prev => prev.filter(s => s.id !== slotId));
      setMyAppointments(prev => [...prev, appointment as Appointment]);
      
      toast.success('✅ Seu horário foi reservado com sucesso! Te esperamos no Carol Amorim Studio 💕');
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      
      // Reload slots to get fresh data
      await loadTimeSlots();
      await loadAppointments();
      
      toast.error(error.message || 'Erro ao criar agendamento. Por favor, tente novamente.');
    }
  };

  const handleCancel = async (appointmentId: string, timeSlotId: string) => {
    try {
      console.log('🗑️ Cancelando agendamento:', appointmentId);
      
      // Delete appointment - o trigger automaticamente libera o time_slot
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (appointmentError) {
        console.error('❌ Erro ao deletar appointment:', appointmentError);
        throw appointmentError;
      }

      console.log('✅ Appointment deletado com sucesso');
      
      // Aguarda um momento para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarrega todos os dados para garantir sincronização
      await Promise.all([
        loadTimeSlots(),
        loadAppointments()
      ]);
      
      toast.success('Agendamento cancelado com sucesso');
    } catch (error: any) {
      console.error('Error canceling appointment:', error);
      toast.error(error.message || 'Erro ao cancelar agendamento');
      
      // Recarrega dados em caso de erro para garantir estado correto
      await loadAppointments();
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Service Selection */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Escolha o Serviço
              </CardTitle>
              <CardDescription>
                Selecione o serviço desejado para ver os horários disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum serviço disponível no momento
                </p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedService?.id === service.id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                      <p className="font-bold text-primary">{service.price}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Appointments */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Meus Agendamentos
              </CardTitle>
              <CardDescription>
                Seus horários reservados no Carol Amorim Studio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myAppointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Você ainda não tem agendamentos
                </p>
              ) : (
                <div className="grid gap-4">
                  {myAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold text-primary">{appointment.services?.name}</p>
                          <p className="font-semibold">{appointment.time_slots?.date ? formatDateShort(appointment.time_slots.date) : ''}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.time_slots?.time}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(appointment.id, appointment.time_slot_id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Slots */}
          {selectedService && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Horários Disponíveis - {selectedService.name}
                </CardTitle>
                <CardDescription>
                  Escolha um horário para seu atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableSlots.filter(s => s.service_id === selectedService.id).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Não há horários disponíveis para este serviço no momento
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableSlots
                      .filter(s => s.service_id === selectedService.id)
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className="p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="mb-3">
                            <p className="font-semibold">{formatDateShort(slot.date)}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {slot.time}
                            </p>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => handleBooking(slot.id, selectedService.id)}
                          >
                            Agendar
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Agendamentos;

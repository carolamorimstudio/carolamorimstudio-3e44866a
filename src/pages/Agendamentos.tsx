import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getCurrentUser, getTimeSlots, getAppointments, saveAppointment, updateAppointment, updateTimeSlot } from '@/lib/storage';
import { Appointment } from '@/types';
import { toast } from 'sonner';

const Agendamentos = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [availableSlots, setAvailableSlots] = useState(getTimeSlots().filter(s => s.status === 'available'));
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!currentUser || currentUser.type === 'admin') {
      navigate('/login');
      return;
    }
    
    const appointments = getAppointments().filter(a => a.clientId === currentUser.id && a.status === 'active');
    setMyAppointments(appointments);
  }, [currentUser, navigate]);

  const handleBooking = (slotId: string, date: string, time: string) => {
    if (!currentUser) return;
    
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      clientId: currentUser.id,
      date,
      time,
      status: 'active',
      clientName: currentUser.name
    };
    
    saveAppointment(newAppointment);
    updateTimeSlot(slotId, { status: 'booked' });
    
    setAvailableSlots(prev => prev.filter(s => s.id !== slotId));
    setMyAppointments(prev => [...prev, newAppointment]);
    
    toast.success('✅ Seu horário foi reservado com sucesso! Te esperamos no Carol Amorim Studio 💕');
  };

  const handleCancel = (appointmentId: string, date: string, time: string) => {
    updateAppointment(appointmentId, { status: 'cancelled' });
    
    const slot = getTimeSlots().find(s => s.date === date && s.time === time);
    if (slot) {
      updateTimeSlot(slot.id, { status: 'available' });
      setAvailableSlots(prev => [...prev, slot]);
    }
    
    setMyAppointments(prev => prev.filter(a => a.id !== appointmentId));
    toast.success('Agendamento cancelado com sucesso');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
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
                          <p className="font-semibold">{appointment.date}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.time}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(appointment.id, appointment.date, appointment.time)}
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
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Horários Disponíveis
              </CardTitle>
              <CardDescription>
                Escolha um horário para seu atendimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableSlots.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Não há horários disponíveis no momento
                </p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="mb-3">
                        <p className="font-semibold">{slot.date}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {slot.time}
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleBooking(slot.id, slot.date, slot.time)}
                      >
                        Agendar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Agendamentos;

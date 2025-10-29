import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Calendar, Users, Clock, Trash2, Plus } from 'lucide-react';
import { getCurrentUser, getUsers, getTimeSlots, getAppointments, saveTimeSlot, deleteTimeSlot, deleteUser, deleteAppointment } from '@/lib/storage';
import { TimeSlot } from '@/types';
import { toast } from 'sonner';

const Admin = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [clients, setClients] = useState(getUsers().filter(u => u.type === 'client'));
  const [timeSlots, setTimeSlots] = useState(getTimeSlots());
  const [appointments, setAppointments] = useState(getAppointments());
  
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.type !== 'admin') {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      date: newSlotDate,
      time: newSlotTime,
      status: 'available'
    };
    
    saveTimeSlot(newSlot);
    setTimeSlots(prev => [...prev, newSlot]);
    setNewSlotDate('');
    setNewSlotTime('');
    toast.success('Horário adicionado com sucesso');
  };

  const handleDeleteSlot = (slotId: string) => {
    deleteTimeSlot(slotId);
    setTimeSlots(prev => prev.filter(s => s.id !== slotId));
    toast.success('Horário removido');
  };

  const handleDeleteClient = (userId: string) => {
    deleteUser(userId);
    setClients(prev => prev.filter(u => u.id !== userId));
    toast.success('Cliente removido');
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    deleteAppointment(appointmentId);
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    toast.success('Agendamento removido');
  };

  if (!currentUser || currentUser.type !== 'admin') return null;

  const activeAppointments = appointments.filter(a => a.status === 'active');
  const stats = {
    totalClients: clients.length,
    totalSlots: timeSlots.length,
    availableSlots: timeSlots.filter(s => s.status === 'available').length,
    bookedSlots: timeSlots.filter(s => s.status === 'booked').length,
    activeAppointments: activeAppointments.length
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif italic text-primary mb-2">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">
              Gerencie horários, clientes e agendamentos
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.totalClients}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Horários Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.availableSlots}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Horários Agendados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.bookedSlots}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Agendamentos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.activeAppointments}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="slots" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="slots">
                <Clock className="h-4 w-4 mr-2" />
                Horários
              </TabsTrigger>
              <TabsTrigger value="appointments">
                <Calendar className="h-4 w-4 mr-2" />
                Agendamentos
              </TabsTrigger>
              <TabsTrigger value="clients">
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="slots" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Novo Horário</CardTitle>
                  <CardDescription>Crie novos horários disponíveis para agendamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSlot} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newSlotDate}
                        onChange={(e) => setNewSlotDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="time">Horário</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newSlotTime}
                        onChange={(e) => setNewSlotTime(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Todos os Horários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{slot.date}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span>{slot.time}</span>
                          <span className="ml-2 text-sm">
                            ({slot.status === 'available' ? '✅ Disponível' : '🔒 Ocupado'})
                          </span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>Todos os Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activeAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{appointment.clientName}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span>{appointment.date}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span>{appointment.time}</span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle>Todos os Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.email} • {client.phone}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;

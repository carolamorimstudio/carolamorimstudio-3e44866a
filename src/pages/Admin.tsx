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
import { getCurrentUser, getUsers, getTimeSlots, getAppointments, saveTimeSlot, deleteTimeSlot, deleteUser, deleteAppointment, updateUser, getServices, saveService, updateService, deleteService } from '@/lib/storage';
import { TimeSlot, Service } from '@/types';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const Admin = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [clients, setClients] = useState(getUsers().filter(u => u.type === 'client'));
  const [timeSlots, setTimeSlots] = useState(getTimeSlots());
  const [appointments, setAppointments] = useState(getAppointments());
  const [services, setServices] = useState(getServices());
  
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotServiceId, setNewSlotServiceId] = useState('');
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.type !== 'admin') {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSlotServiceId) {
      toast.error('Selecione um serviço');
      return;
    }
    
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      serviceId: newSlotServiceId,
      date: newSlotDate,
      time: newSlotTime,
      status: 'available'
    };
    
    saveTimeSlot(newSlot);
    setTimeSlots(prev => [...prev, newSlot]);
    setNewSlotDate('');
    setNewSlotTime('');
    setNewSlotServiceId('');
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

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    const updates: Partial<typeof currentUser> = {};
    if (newEmail) updates.email = newEmail;
    if (newPassword) updates.password = newPassword;
    
    if (Object.keys(updates).length === 0) {
      toast.error('Preencha pelo menos um campo');
      return;
    }
    
    updateUser(currentUser.id, updates);
    setNewEmail('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('✅ Suas credenciais foram atualizadas com sucesso.');
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingService) {
      updateService(editingService.id, {
        name: serviceName,
        description: serviceDescription,
        price: servicePrice
      });
      setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, name: serviceName, description: serviceDescription, price: servicePrice } : s));
      toast.success('Serviço atualizado com sucesso');
      setEditingService(null);
    } else {
      const newService: Service = {
        id: Date.now().toString(),
        name: serviceName,
        description: serviceDescription,
        price: servicePrice
      };
      saveService(newService);
      setServices(prev => [...prev, newService]);
      toast.success('Serviço adicionado com sucesso');
    }
    
    setServiceName('');
    setServiceDescription('');
    setServicePrice('');
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceDescription(service.description);
    setServicePrice(service.price);
  };

  const handleDeleteService = (serviceId: string) => {
    deleteService(serviceId);
    setServices(prev => prev.filter(s => s.id !== serviceId));
    toast.success('Serviço removido');
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setServiceName('');
    setServiceDescription('');
    setServicePrice('');
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
          <Tabs defaultValue="services" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="services">
                Serviços
              </TabsTrigger>
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
              <TabsTrigger value="settings">
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</CardTitle>
                  <CardDescription>Gerencie os serviços oferecidos no estúdio</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveService} className="space-y-4">
                    <div>
                      <Label htmlFor="serviceName">Nome do Serviço</Label>
                      <Input
                        id="serviceName"
                        type="text"
                        placeholder="Ex: Extensão Clássica"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceDescription">Descrição</Label>
                      <Textarea
                        id="serviceDescription"
                        placeholder="Descreva o serviço..."
                        value={serviceDescription}
                        onChange={(e) => setServiceDescription(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="servicePrice">Preço</Label>
                      <Input
                        id="servicePrice"
                        type="text"
                        placeholder="Ex: R$ 150,00"
                        value={servicePrice}
                        onChange={(e) => setServicePrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingService ? 'Atualizar' : 'Adicionar'}
                      </Button>
                      {editingService && (
                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Todos os Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum serviço cadastrado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-start justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{service.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                            <p className="text-sm font-medium text-primary mt-2">{service.price}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="slots" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Novo Horário</CardTitle>
                  <CardDescription>Crie novos horários disponíveis para agendamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSlot} className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="service">Serviço</Label>
                      <Select value={newSlotServiceId} onValueChange={setNewSlotServiceId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newSlotDate}
                        onChange={(e) => setNewSlotDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex-1 min-w-[150px]">
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
                    {timeSlots.map((slot) => {
                      const service = services.find(s => s.id === slot.serviceId);
                      return (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <span className="font-medium">{service?.name || 'Serviço removido'}</span>
                            <span className="mx-2 text-muted-foreground">•</span>
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
                      );
                    })}
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
                          <span className="font-medium">{appointment.serviceName || 'Serviço'}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
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

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Conta</CardTitle>
                  <CardDescription>Alterar e-mail e senha do administrador</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateCredentials} className="space-y-4">
                    <div>
                      <Label htmlFor="newEmail">Novo E-mail</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder={currentUser?.email}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Digite a nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit">
                      Atualizar Credenciais
                    </Button>
                  </form>
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

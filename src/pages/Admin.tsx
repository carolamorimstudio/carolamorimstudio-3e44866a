import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Calendar, Users, Clock, Trash2, Plus, AlertCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface Profile {
  id: string;
  user_id: string;
  name: string;
  profiles_private?: {
    phone: string | null;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotServiceId, setNewSlotServiceId] = useState('');
  
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [instagramUrl, setInstagramUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Load data when authenticated
  useEffect(() => {
    if (user && isAdmin) {
      loadAllData();
    }
  }, [user, isAdmin]);

  // Set up realtime subscriptions for clients
  useEffect(() => {
    if (!user || !isAdmin) return;

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [user, isAdmin]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadServices(),
        loadTimeSlots(),
        loadAppointments(),
        loadClients(),
        loadSiteSettings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
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
      toast.error('Erro ao carregar serviços');
    }
  };

  const loadTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*, services(*)')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log('📥 CARREGANDO DO BANCO:', {
          primeira_data_raw: data[0].date,
          tipo: typeof data[0].date,
          formatada: formatDateShort(data[0].date)
        });
      }
      
      setTimeSlots((data || []) as TimeSlot[]);
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast.error('Erro ao carregar horários');
    }
  };

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(*), time_slots(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Erro ao carregar agendamentos');
    }
  };

  const loadClients = async () => {
    try {
      // Load admin user IDs to filter them out
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Load private data for admins
      const { data: privateData, error: privateError } = await supabase
        .from('profiles_private')
        .select('user_id, phone');

      if (privateError) throw privateError;

      // Merge the data and filter out admins
      const mergedClients = (profilesData || [])
        .filter(profile => !adminUserIds.has(profile.user_id))
        .map(profile => ({
          ...profile,
          profiles_private: privateData?.find(pd => pd.user_id === profile.user_id) || null
        }));

      setClients(mergedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const loadSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const settings = data || [];
      const instagram = settings.find(s => s.key === 'instagram_url');
      const whatsapp = settings.find(s => s.key === 'whatsapp_number');

      setInstagramUrl(instagram?.value || '');
      setWhatsappNumber(whatsapp?.value || '');
    } catch (error) {
      console.error('Error loading site settings:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Update Instagram URL
      const { error: instagramError } = await supabase
        .from('site_settings')
        .update({ value: instagramUrl })
        .eq('key', 'instagram_url');

      if (instagramError) throw instagramError;

      // Update WhatsApp number
      const { error: whatsappError } = await supabase
        .from('site_settings')
        .update({ value: whatsappNumber })
        .eq('key', 'whatsapp_number');

      if (whatsappError) throw whatsappError;

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Erro ao salvar configurações');
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSlotServiceId) {
      toast.error('Selecione um serviço');
      return;
    }

    if (services.length === 0) {
      toast.error('Nenhum serviço disponível. Por favor, crie um serviço primeiro.');
      return;
    }
    
    try {
      // Envia a data EXATAMENTE como está no input (formato YYYY-MM-DD)
      // SEM conversões, SEM Date(), apenas string pura
      console.log('💾 ANTES DE SALVAR:', {
        valor_do_input: newSlotDate,
        tipo: typeof newSlotDate
      });
      
      const { data, error } = await supabase
        .from('time_slots')
        .insert({
          service_id: newSlotServiceId,
          date: newSlotDate, // String pura do input, sem conversão
          time: newSlotTime,
          status: 'available'
        })
        .select('*, services(*)')
        .single();

      if (error) throw error;
      
      console.log('📤 DEPOIS DE SALVAR:', {
        data_retornada: data.date,
        tipo: typeof data.date,
        data_formatada: formatDateShort(data.date)
      });
      
      setTimeSlots(prev => [...prev, data as TimeSlot]);
      setNewSlotDate('');
      setNewSlotTime('');
      setNewSlotServiceId('');
      
      const serviceName = data.services?.name || 'o serviço selecionado';
      toast.success(`✅ Horário criado com sucesso para ${serviceName}`);
    } catch (error: any) {
      console.error('Error adding slot:', error);
      toast.error(error.message || 'Erro ao criar horário');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      setTimeSlots(prev => prev.filter(s => s.id !== slotId));
      toast.success('Horário removido');
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      toast.error(error.message || 'Erro ao remover horário');
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingService) {
        const { data, error } = await supabase
          .from('services')
          .update({
            name: serviceName,
            description: serviceDescription,
            price: servicePrice
          })
          .eq('id', editingService.id)
          .select()
          .single();

        if (error) throw error;

        setServices(prev => prev.map(s => s.id === editingService.id ? data : s));
        toast.success('Serviço atualizado com sucesso');
        setEditingService(null);
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert({
            name: serviceName,
            description: serviceDescription,
            price: servicePrice
          })
          .select()
          .single();

        if (error) throw error;

        setServices(prev => [...prev, data]);
        toast.success('Serviço adicionado com sucesso');
      }
      
      setServiceName('');
      setServiceDescription('');
      setServicePrice('');
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.message || 'Erro ao salvar serviço');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceDescription(service.description);
    setServicePrice(service.price);
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success('Serviço removido');
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Erro ao remover serviço');
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setServiceName('');
    setServiceDescription('');
    setServicePrice('');
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.filter(a => a.id !== appointmentId));
      toast.success('Agendamento removido');
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast.error(error.message || 'Erro ao remover agendamento');
    }
  };

  const handleDeleteClient = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.user_id !== userId));
      toast.success('Cliente removido');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error(error.message || 'Erro ao remover cliente');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

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
                <Settings className="h-4 w-4 mr-2" />
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
                  {services.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nenhum serviço disponível. Por favor, crie um serviço primeiro na aba "Serviços".
                      </AlertDescription>
                    </Alert>
                  ) : (
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
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Todos os Horários</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeSlots.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum horário cadastrado
                    </p>
                  ) : (
                     <div className="space-y-2">
                      {timeSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div>
                              <span className="font-medium">{slot.services?.name || 'Serviço removido'}</span>
                              <span className="mx-2 text-muted-foreground">•</span>
                              <span className="font-medium">{formatDateShort(slot.date)}</span>
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle>Todos os Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum agendamento ativo
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                        <div>
                          <p className="font-medium">Cliente</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.services?.name || 'Serviço'} - {appointment.time_slots?.date ? formatDateShort(appointment.time_slots.date) : ''} às {appointment.time_slots?.time || ''}
                          </p>
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle>Todos os Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {clients.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum cliente cadastrado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.profiles_private?.phone || 'Sem telefone'}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClient(client.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Site</CardTitle>
                  <CardDescription>
                    Configure links das redes sociais que aparecem no rodapé
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="instagramUrl">Link do Instagram</Label>
                      <Input
                        id="instagramUrl"
                        type="url"
                        placeholder="https://instagram.com/seu_perfil"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Cole o link completo do seu perfil do Instagram
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="whatsappNumber">Número do WhatsApp</Label>
                      <Input
                        id="whatsappNumber"
                        type="tel"
                        placeholder="5511999999999"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Digite apenas números com código do país e DDD (ex: 5511999999999)
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} className="w-full md:w-auto">
                    Salvar Configurações
                  </Button>
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

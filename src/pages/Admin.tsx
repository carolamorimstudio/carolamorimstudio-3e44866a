import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Calendar, Users, Clock, Trash2, Plus, AlertCircle, Settings, Image as ImageIcon, Upload } from 'lucide-react';
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
  profiles?: {
    name: string;
    user_id: string;
    profiles_private?: {
      phone: string | null;
    };
  };
  client_email?: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
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

  // States for admin account settings
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States for logo and gallery
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryDescription, setGalleryDescription] = useState('');
  const [galleryFile, setGalleryFile] = useState<File | null>(null);

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
        loadSiteSettings(),
        loadLogo(),
        loadGallery()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadLogo = async () => {
    try {
      const { data, error } = await supabase.storage.from('logo').list('', { limit: 1 });
      if (error) throw error;
      if (data && data.length > 0) {
        const { data: { publicUrl } } = supabase.storage.from('logo').getPublicUrl(data[0].name);
        setLogoUrl(publicUrl);
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  };

  const loadGallery = async () => {
    try {
      const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGalleryImages(data || []);
    } catch (error) {
      console.error('Error loading gallery:', error);
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
      setTimeSlots((data || []) as TimeSlot[]);
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast.error('Erro ao carregar horários');
    }
  };

  const loadAppointments = async () => {
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*, services(*), time_slots(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load client profiles and email for each appointment
      const appointmentsWithProfiles = await Promise.all(
        (appointmentsData || []).map(async (apt) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, user_id')
            .eq('user_id', apt.client_id)
            .single();

          const { data: privateData } = await supabase
            .from('profiles_private')
            .select('phone')
            .eq('user_id', apt.client_id)
            .single();

          // Get user email from auth.users via admin API
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(apt.client_id);

          return {
            ...apt,
            profiles: profile ? {
              ...profile,
              profiles_private: privateData
            } : undefined,
            client_email: authUser?.email || 'Email não disponível'
          };
        })
      );

      setAppointments(appointmentsWithProfiles as Appointment[]);
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

      // Get emails from auth.users for all clients
      const clientsWithEmails = await Promise.all(
        (profilesData || [])
          .filter(profile => !adminUserIds.has(profile.user_id))
          .map(async (profile) => {
            const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.user_id);
            
            return {
              ...profile,
              email: authUser?.email || 'Email não disponível',
              profiles_private: privateData?.find(pd => pd.user_id === profile.user_id) || null
            };
          })
      );

      setClients(clientsWithEmails);
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
      // Upsert Instagram URL (cria se não existir, atualiza se existir)
      const { error: instagramError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'instagram_url',
          value: instagramUrl 
        }, { 
          onConflict: 'key' 
        });

      if (instagramError) throw instagramError;

      // Upsert WhatsApp number (cria se não existir, atualiza se existir)
      const { error: whatsappError } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'whatsapp_number',
          value: whatsappNumber 
        }, { 
          onConflict: 'key' 
        });

      if (whatsappError) throw whatsappError;

      toast.success('Configurações salvas com sucesso! As mudanças já estão visíveis no rodapé.');
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
      const { data, error } = await supabase
        .from('time_slots')
        .insert({
          service_id: newSlotServiceId,
          date: newSlotDate,
          time: newSlotTime,
          status: 'available'
        })
        .select('*, services(*)')
        .single();

      if (error) throw error;
      
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const response = await fetch(
        'https://gsvaitbqkmrsdswzfrmh.supabase.co/functions/v1/delete-user',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao remover cliente');
      }

      setClients(prev => prev.filter(c => c.user_id !== userId));
      toast.success('Cliente removido completamente do sistema');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error(error.message || 'Erro ao remover cliente');
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast.error('Digite o novo email');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast.success('Email atualizado! Verifique seu novo email para confirmar a alteração.');
      setNewEmail('');
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast.error(error.message || 'Erro ao atualizar email');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error('Digite a nova senha');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    }
  };

  const handleLogoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) {
      toast.error('Selecione uma imagem');
      return;
    }

    try {
      const { data: existingFiles } = await supabase.storage.from('logo').list('');
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage.from('logo').remove(existingFiles.map(f => f.name));
      }

      const fileName = `logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('logo').upload(fileName, logoFile);

      if (uploadError) throw uploadError;

      toast.success('Logo atualizada com sucesso!');
      setLogoFile(null);
      await loadLogo();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Erro ao fazer upload da logo');
    }
  };

  const handleDeleteLogo = async () => {
    try {
      const { data: existingFiles } = await supabase.storage.from('logo').list('');
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage.from('logo').remove(existingFiles.map(f => f.name));
      }
      
      toast.success('Logo removida com sucesso!');
      setLogoUrl('');
      await loadLogo();
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast.error(error.message || 'Erro ao remover logo');
    }
  };

  const handleGalleryUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryFile) {
      toast.error('Selecione uma imagem');
      return;
    }

    try {
      const fileName = `gallery-${Date.now()}.${galleryFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, galleryFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('gallery').insert({
        image_url: publicUrl,
        title: galleryTitle || null,
        description: galleryDescription || null
      });

      if (dbError) throw dbError;

      toast.success('Imagem adicionada à galeria!');
      setGalleryFile(null);
      setGalleryTitle('');
      setGalleryDescription('');
      await loadGallery();
    } catch (error: any) {
      console.error('Error uploading to gallery:', error);
      toast.error(error.message || 'Erro ao fazer upload da imagem');
    }
  };

  const handleDeleteGalleryImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    try {
      const fileName = imageUrl.split('/').pop();
      
      if (fileName) {
        await supabase.storage.from('gallery').remove([fileName]);
      }

      const { error } = await supabase.from('gallery').delete().eq('id', imageId);
      if (error) throw error;

      toast.success('Imagem excluída com sucesso!');
      await loadGallery();
    } catch (error: any) {
      console.error('Error deleting gallery image:', error);
      toast.error(error.message || 'Erro ao excluir imagem');
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
            <TabsList className="w-full h-auto gap-1 flex flex-wrap justify-center p-1">
              <TabsTrigger value="services" className="flex items-center gap-1 py-2 px-3 flex-1 min-w-[100px]">
                <Plus className="h-4 w-4" />
                <span className="text-xs md:text-sm">Serviços</span>
              </TabsTrigger>
              <TabsTrigger value="slots" className="flex items-center gap-1 py-2 px-3 flex-1 min-w-[100px]">
                <Clock className="h-4 w-4" />
                <span className="text-xs md:text-sm">Horários</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-1 py-2 px-3 flex-1 min-w-[100px]">
                <Calendar className="h-4 w-4" />
                <span className="text-xs md:text-sm">Agendas</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-1 py-2 px-3 flex-1 min-w-[100px]">
                <Users className="h-4 w-4" />
                <span className="text-xs md:text-sm">Clientes</span>
              </TabsTrigger>
              <TabsTrigger value="logo" className="flex items-center gap-1 py-2 px-3 flex-1 min-w-[100px]">
                <Upload className="h-4 w-4" />
                <span className="text-xs md:text-sm">Logo</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-1 py-2 px-3 flex-1 min-w-[100px]">
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs md:text-sm">Galeria</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 py-2 px-3 flex-1 min-w-[100px]">
                <Settings className="h-4 w-4" />
                <span className="text-xs md:text-sm">Config</span>
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
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{appointment.profiles?.name || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            📧 {appointment.client_email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            📞 {appointment.profiles?.profiles_private?.phone || 'Sem telefone'}
                          </p>
                          <p className="text-sm text-primary font-medium mt-2">
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
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{client.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              📧 {client.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              📞 {client.profiles_private?.phone || 'Sem telefone'}
                            </p>
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

            {/* Logo Tab */}
            <TabsContent value="logo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Logo do Site</CardTitle>
                  <CardDescription>
                    Faça upload da logo que aparecerá no header do site
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {logoUrl && (
                    <div className="p-4 border rounded-lg bg-secondary/20 space-y-4">
                      <div className="flex flex-col items-center">
                        <p className="text-sm font-medium mb-2">Logo Atual:</p>
                        <img src={logoUrl} alt="Logo atual" className="max-h-32 object-contain mb-3" />
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleDeleteLogo}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover Logo
                      </Button>
                    </div>
                  )}
                  <form onSubmit={handleLogoUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="logoFile">Selecionar Nova Logo</Label>
                      <Input
                        id="logoFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Recomendado: PNG ou SVG com fundo transparente. A logo aparecerá no header de todas as páginas.
                      </p>
                    </div>
                    <Button type="submit" disabled={!logoFile}>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoUrl ? 'Alterar Logo' : 'Fazer Upload'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Imagem à Galeria</CardTitle>
                  <CardDescription>
                    Adicione fotos do seu trabalho para clientes visualizarem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGalleryUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="galleryTitle">Título (opcional)</Label>
                      <Input
                        id="galleryTitle"
                        type="text"
                        placeholder="Ex: Extensão de Cílios Volume Russo"
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="galleryDescription">Descrição (opcional)</Label>
                      <Textarea
                        id="galleryDescription"
                        placeholder="Descreva o trabalho..."
                        value={galleryDescription}
                        onChange={(e) => setGalleryDescription(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="galleryFile">Selecionar Imagem</Label>
                      <Input
                        id="galleryFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setGalleryFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={!galleryFile}>
                      <Upload className="h-4 w-4 mr-2" />
                      Adicionar à Galeria
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Todas as Imagens da Galeria</CardTitle>
                </CardHeader>
                <CardContent>
                  {galleryImages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma imagem na galeria
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img 
                            src={image.image_url} 
                            alt={image.title || 'Gallery'} 
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteGalleryImage(image.id, image.image_url)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {image.title && (
                            <p className="text-sm font-medium mt-2">{image.title}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              {/* Redes Sociais */}
              <Card>
                <CardHeader>
                  <CardTitle>Redes Sociais</CardTitle>
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
                    Salvar Redes Sociais
                  </Button>
                </CardContent>
              </Card>

              {/* Alterar Email */}
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Email</CardTitle>
                  <CardDescription>
                    Atualize o email da sua conta de administrador
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div>
                      <Label htmlFor="newEmail">Novo Email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="novo@email.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Você receberá um email de confirmação no novo endereço
                      </p>
                    </div>
                    <Button type="submit" className="w-full md:w-auto">
                      Alterar Email
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Alterar Senha */}
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>
                    Atualize a senha da sua conta de administrador
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Digite a senha novamente"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full md:w-auto">
                      Alterar Senha
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

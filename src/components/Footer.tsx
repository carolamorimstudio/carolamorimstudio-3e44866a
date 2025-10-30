import { useState, useEffect } from 'react';
import { Instagram, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const Footer = () => {
  const [instagramUrl, setInstagramUrl] = useState('https://instagram.com/carolamorimstudio');
  const [whatsappNumber, setWhatsappNumber] = useState('5511999999999');

  useEffect(() => {
    loadSiteSettings();
  }, []);

  const loadSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) {
        console.error('Error loading site settings:', error);
        return;
      }

      const settings = data || [];
      const instagram = settings.find(s => s.key === 'instagram_url');
      const whatsapp = settings.find(s => s.key === 'whatsapp_number');

      if (instagram?.value) setInstagramUrl(instagram.value);
      if (whatsapp?.value) setWhatsappNumber(whatsapp.value);
    } catch (error) {
      console.error('Error loading site settings:', error);
    }
  };

  const getWhatsAppLink = () => {
    // Remove all non-numeric characters
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Carol Amorim Studio. Todos os direitos reservados.
          </p>
          
          <div className="flex items-center gap-4">
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-sm">Instagram</span>
              </a>
            )}
            
            {whatsappNumber && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
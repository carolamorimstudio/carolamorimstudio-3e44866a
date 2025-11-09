import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLogo = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from('logo').list('', { limit: 1 });
      if (error) throw error;
      if (data && data.length > 0) {
        const { data: { publicUrl } } = supabase.storage.from('logo').getPublicUrl(data[0].name);
        setLogoUrl(publicUrl);
      } else {
        setLogoUrl('');
      }
    } catch (error) {
      console.error('Error loading logo:', error);
      setLogoUrl('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogo();

    // Set up realtime subscription for logo changes
    const channel = supabase
      .channel('logo-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'storage',
          table: 'objects',
          filter: `bucket_id=eq.logo`
        },
        () => {
          loadLogo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { logoUrl, loading, refetch: loadLogo };
};

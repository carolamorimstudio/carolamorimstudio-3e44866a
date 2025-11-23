-- CORREÇÕES DE SEGURANÇA CRÍTICAS

-- 1. REMOVER coluna email da tabela profiles
-- Emails devem estar APENAS em profiles_private ou auth.users, nunca publicamente acessíveis
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 2. CRIAR POLÍTICAS RESTRITAS para site_settings
-- Remover política pública atual e criar políticas específicas
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;

-- Permitir visualização pública APENAS de configurações não-sensíveis
CREATE POLICY "Public can view non-sensitive settings"
ON public.site_settings
FOR SELECT
USING (
  key IN ('instagram_url', 'whatsapp_number', 'facebook_url', 'site_description')
);

-- Admin pode ver TODAS as configurações (incluindo admin_email)
CREATE POLICY "Admins can view all settings"
ON public.site_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. MELHORAR política de INSERT em email_notifications
-- Remover política permissiva atual
DROP POLICY IF EXISTS "Service role can insert email notifications" ON public.email_notifications;

-- Nova política mais restritiva: apenas se o appointment_id existir e for válido
CREATE POLICY "Service role can insert valid email notifications"
ON public.email_notifications
FOR INSERT
WITH CHECK (
  -- Verificar que o appointment_id existe na tabela appointments
  EXISTS (
    SELECT 1 
    FROM public.appointments 
    WHERE id = appointment_id
  )
);

-- 4. ATUALIZAR trigger handle_new_user para NÃO popular email em profiles
-- O email já está em auth.users, não precisa duplicar em profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile SEM email (email fica apenas em auth.users)
  INSERT INTO public.profiles (user_id, name, is_public)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    false
  );
  
  -- Insert private data com phone
  INSERT INTO public.profiles_private (user_id, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Assign client role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;
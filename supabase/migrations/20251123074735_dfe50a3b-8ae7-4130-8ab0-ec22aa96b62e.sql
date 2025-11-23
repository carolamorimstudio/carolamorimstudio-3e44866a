-- Adicionar coluna email na tabela profiles_private (que é segura e restrita)
-- Isso permite que admins vejam emails de clientes, mas mantém a segurança
ALTER TABLE public.profiles_private ADD COLUMN IF NOT EXISTS email text;

-- Atualizar função handle_new_user para popular email em profiles_private
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile SEM email (seguro)
  INSERT INTO public.profiles (user_id, name, is_public)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    false
  );
  
  -- Insert private data com phone E email (apenas admins podem ver)
  INSERT INTO public.profiles_private (user_id, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  );
  
  -- Assign client role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

-- Backfill: copiar emails existentes de auth.users para profiles_private
UPDATE public.profiles_private pp
SET email = au.email
FROM auth.users au
WHERE pp.user_id = au.id
  AND (pp.email IS NULL OR pp.email = '');
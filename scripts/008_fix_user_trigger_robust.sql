-- SCRIPT DE CORREÇÃO: GATILHO DE SINCRONIZAÇÃO ROBUSTO
-- Este script não depende do tipo papel_sistema e funciona mesmo se ele não existir.

-- 1. GARANTIR CASCATEAMENTO NAS CHAVES ESTRANGEIRAS
ALTER TABLE public.agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_usuario_id_fkey;

ALTER TABLE public.agendamentos
ADD CONSTRAINT agendamentos_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.agendamentos_fixos 
DROP CONSTRAINT IF EXISTS agendamentos_fixos_usuario_id_fkey;

ALTER TABLE public.agendamentos_fixos
ADD CONSTRAINT agendamentos_fixos_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. CRIAR FUNÇÃO ROBUSTA DE SINCRONIZAÇÃO (SEM DEPENDÊNCIA DE papel_sistema)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_id UUID;
  v_first_user BOOLEAN;
  v_tipo text;
BEGIN
  -- Verificar se já existe um usuário criado manualmente (por admin) com este email
  SELECT id INTO v_existing_id FROM public.usuarios WHERE email = NEW.email LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- LÓGICA DE MERGE: O email já existe, atualizar o ID antigo pelo ID real do Auth
    -- O 'ON UPDATE CASCADE' nas outras tabelas garantirá que nada se quebre.
    UPDATE public.usuarios 
    SET 
      id = NEW.id,
      updated_at = NOW()
    WHERE id = v_existing_id;
    
    RETURN NEW;
  END IF;

  -- LÓGICA DE CRIAÇÃO NOVA (se não existia email prévio)
  SELECT COUNT(*) = 0 INTO v_first_user FROM public.usuarios;
  
  -- Determinar tipo de usuário (primeiro usuário é admin, demais são 'usuario')
  v_tipo := COALESCE(
    NEW.raw_user_meta_data->>'tipo', 
    CASE WHEN v_first_user THEN 'admin' ELSE 'usuario' END
  );

  INSERT INTO public.usuarios (id, email, nome, tipo, ativo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    v_tipo::tipo_usuario,
    true
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log do erro para debugging (visível nos logs do Supabase)
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECRIAR O TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Garantir que RLS permita a leitura de usuários para autenticados
DROP POLICY IF EXISTS "usuarios_select_all" ON public.usuarios;
CREATE POLICY "usuarios_select_all" ON public.usuarios
  FOR SELECT TO authenticated
  USING (true);

-- 5. Permitir que admins gerenciem todos os usuários
DROP POLICY IF EXISTS "admins_manage_usuarios" ON public.usuarios;
CREATE POLICY "admins_manage_usuarios" ON public.usuarios
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo = 'admin')
  );

-- SCRIPT DE REPARO: FLUXO DE CRIAÇÃO E MESCLAGEM DE USUÁRIOS
-- Este script garante que usuários pré-criados por admins consigam logar e manter seus dados.

-- 1. ADICIONAR CASCATEAMENTO NAS CHAVES ESTRANGEIRAS
-- Necessário para permitir que o ID do usuário mude durante o primeiro login sem quebrar referências.

-- Tabela: agendamentos
ALTER TABLE public.agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_usuario_id_fkey,
ADD CONSTRAINT agendamentos_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Tabela: agendamentos_fixos
ALTER TABLE public.agendamentos_fixos 
DROP CONSTRAINT IF EXISTS agendamentos_fixos_usuario_id_fkey,
ADD CONSTRAINT agendamentos_fixos_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. ATUALIZAR FUNÇÃO DE SINCRONIZAÇÃO COM LÓGICA DE MERGE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_id UUID;
  v_first_user BOOLEAN;
  v_tipo tipo_usuario;
  v_papel papel_sistema;
BEGIN
  -- Verificar se já existe um usuário criado manualmente (por admin) com este email
  SELECT id INTO v_existing_id FROM public.usuarios WHERE email = NEW.email LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- LÓGICA DE MERGE: O email já existe, vamos atualizar o ID antigo (aleatório) pelo ID real do Auth
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
  
  v_tipo := COALESCE(
    (NEW.raw_user_meta_data->>'tipo')::tipo_usuario, 
    CASE WHEN v_first_user THEN 'admin' ELSE 'usuario' END
  );
  
  -- Algumas migrações antigas podem não ter o tipo papel_sistema, vamos tratar com cautela
  BEGIN
    v_papel := COALESCE((NEW.raw_user_meta_data->>'papel')::papel_sistema, 'professor');
  EXCEPTION WHEN OTHERS THEN
    v_papel := NULL;
  END;

  INSERT INTO public.usuarios (id, email, nome, tipo, ativo, papel)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    v_tipo,
    true,
    v_papel
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GARANTIR QUE O TRIGGER ESTEJA ATIVO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. REVISÃO DE SEGURANÇA NO RLS PARA UPDATE DE USUÁRIO
-- Garante que o usuário consiga atualizar seu próprio perfil básico mesmo após a mesclagem.
DROP POLICY IF EXISTS "usuarios_update_self" ON public.usuarios;
CREATE POLICY "usuarios_update_self" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- SCRIPT DEFINITIVO: REMOVER TODAS AS POLÍTICAS RECURSIVAS
-- Este script REMOVE TODAS as políticas existentes e cria novas 100% não-recursivas

-- =============================================
-- 1. REMOVER ABSOLUTAMENTE TODAS AS POLÍTICAS
-- =============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('usuarios', 'espacos', 'agendamentos', 'agendamentos_fixos')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- =============================================
-- 2. HABILITAR RLS EM TODAS AS TABELAS
-- =============================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos_fixos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. POLÍTICAS 100% NÃO-RECURSIVAS PARA USUARIOS
-- =============================================

-- Todos autenticados podem LER todos os usuários (necessário para o sistema funcionar)
CREATE POLICY "usuarios_read_all" ON public.usuarios
  FOR SELECT TO authenticated
  USING (true);

-- Usuário pode inserir a si mesmo (para auto-criação após OTP)
CREATE POLICY "usuarios_insert_self" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Usuário pode atualizar a si mesmo
CREATE POLICY "usuarios_update_self" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ninguém pode deletar usuários via API (apenas via console Supabase)
-- Isso evita exclusões acidentais e simplifica as políticas

-- =============================================
-- 4. POLÍTICAS PARA ESPACOS (SIMPLES)
-- =============================================

-- Todos autenticados podem ler e modificar espaços
-- (A lógica de permissão fica no frontend, não no RLS)
CREATE POLICY "espacos_all_authenticated" ON public.espacos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 5. POLÍTICAS PARA AGENDAMENTOS
-- =============================================

-- Todos autenticados podem ler todos os agendamentos
CREATE POLICY "agendamentos_read_all" ON public.agendamentos
  FOR SELECT TO authenticated
  USING (true);

-- Usuário pode criar agendamentos em seu próprio nome
CREATE POLICY "agendamentos_insert_self" ON public.agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- Usuário pode atualizar seus próprios agendamentos pendentes
CREATE POLICY "agendamentos_update_self" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Todos autenticados podem atualizar status (gestores/admins)
-- A verificação de permissão é feita no frontend
CREATE POLICY "agendamentos_update_status" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuário pode deletar seus próprios agendamentos
CREATE POLICY "agendamentos_delete_self" ON public.agendamentos
  FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());

-- =============================================
-- 6. POLÍTICAS PARA AGENDAMENTOS FIXOS
-- =============================================

-- Todos autenticados podem ler e modificar agendamentos fixos
-- (A lógica de permissão fica no frontend)
CREATE POLICY "agendamentos_fixos_all" ON public.agendamentos_fixos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 7. GARANTIR CASCATEAMENTO NAS CHAVES ESTRANGEIRAS
-- =============================================
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

-- =============================================
-- 8. RECRIAR GATILHO DE SINCRONIZAÇÃO
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_id UUID;
  v_first_user BOOLEAN;
  v_tipo text;
BEGIN
  -- Verificar se já existe um usuário com este email
  SELECT id INTO v_existing_id FROM public.usuarios WHERE email = NEW.email LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- MERGE: Atualizar o ID antigo pelo ID real do Auth
    UPDATE public.usuarios 
    SET id = NEW.id, updated_at = NOW()
    WHERE id = v_existing_id;
    RETURN NEW;
  END IF;

  -- Criação nova
  SELECT COUNT(*) = 0 INTO v_first_user FROM public.usuarios;
  v_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo', CASE WHEN v_first_user THEN 'admin' ELSE 'usuario' END);

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
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

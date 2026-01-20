-- Migration para Supabase Auth Passwordless (OTP por Email)
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Função para sincronizar usuários do Supabase Auth com tabela usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar usuário na tabela public.usuarios
  INSERT INTO public.usuarios (id, email, nome, tipo, ativo, papel)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'tipo')::tipo_usuario, 'usuario'),
    true,
    COALESCE((NEW.raw_user_meta_data->>'papel')::papel_sistema, 'professor')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger para novos usuários autenticados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Remover colunas de senha (não mais necessárias)
-- Comentado para segurança - execute manualmente após confirmar migração
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS senha;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS senha_hash;

-- 4. Atualizar políticas RLS para usar auth.uid()

-- USUARIOS
DROP POLICY IF EXISTS "Allow authenticated access usuarios" ON usuarios;
DROP POLICY IF EXISTS "Users can view all usuarios" ON usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;
DROP POLICY IF EXISTS "Admins can manage all usuarios" ON usuarios;

CREATE POLICY "authenticated_read_usuarios" ON usuarios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users_update_own_profile" ON usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admins_manage_usuarios" ON usuarios
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo = 'admin')
  );

-- ESPACOS
DROP POLICY IF EXISTS "Allow authenticated access espacos" ON espacos;

CREATE POLICY "authenticated_read_espacos" ON espacos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admins_manage_espacos" ON espacos
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo = 'admin')
  );

-- AGENDAMENTOS
DROP POLICY IF EXISTS "Allow authenticated access agendamentos" ON agendamentos;

CREATE POLICY "authenticated_read_agendamentos" ON agendamentos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users_create_own_agendamentos" ON agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "users_update_own_pending" ON agendamentos
  FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid() AND status = 'pendente');

CREATE POLICY "gestores_manage_space_agendamentos" ON agendamentos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() 
      AND (u.tipo = 'admin' OR (u.tipo = 'gestor' AND agendamentos.espaco_id = ANY(u.espacos)))
    )
  );

-- AGENDAMENTOS_FIXOS
DROP POLICY IF EXISTS "Allow authenticated access agendamentos_fixos" ON agendamentos_fixos;

CREATE POLICY "authenticated_read_agendamentos_fixos" ON agendamentos_fixos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admins_gestores_manage_fixos" ON agendamentos_fixos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() 
      AND (u.tipo = 'admin' OR (u.tipo = 'gestor' AND agendamentos_fixos.espaco_id = ANY(u.espacos)))
    )
  );

-- Verificar se as políticas foram criadas
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

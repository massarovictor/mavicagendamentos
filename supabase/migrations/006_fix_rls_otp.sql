-- Corrige RLS recursivo e garante sincronizacao com Supabase Auth (OTP)

-- Sincronizar usuario do Supabase Auth com public.usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_user BOOLEAN;
  v_tipo tipo_usuario;
BEGIN
  -- Se for o primeiro usuário, força tipo admin; caso contrário usa metadata ou 'usuario'
  SELECT COUNT(*) = 0 INTO v_first_user FROM public.usuarios;
  v_tipo := COALESCE((NEW.raw_user_meta_data->>'tipo')::tipo_usuario, CASE WHEN v_first_user THEN 'admin' ELSE 'usuario' END);

  INSERT INTO public.usuarios (id, email, nome, tipo, ativo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    v_tipo,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    tipo = EXCLUDED.tipo,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos_fixos ENABLE ROW LEVEL SECURITY;

-- Remover todas as politicas antigas (evita nomes com acentos/encoding)
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

-- Politicas nao-recursivas (baseadas apenas em auth.uid, sem depender de metadata)
CREATE POLICY "usuarios_select_all" ON public.usuarios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "usuarios_insert_self" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_update_self" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_delete_self" ON public.usuarios
  FOR DELETE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "espacos_all_authenticated" ON public.espacos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "agendamentos_select_all" ON public.agendamentos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "agendamentos_insert_self" ON public.agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "agendamentos_update_self" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "agendamentos_delete_self" ON public.agendamentos
  FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "agendamentos_fixos_all_authenticated" ON public.agendamentos_fixos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Script RLS para Sistema de Autenticação Customizado
-- Execute no Supabase Dashboard > SQL Editor

-- IMPORTANTE: Este sistema NÃO usa Supabase Auth
-- A autenticação é feita via tabela 'usuarios' customizada

-- Reabilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacos ENABLE ROW LEVEL SECURITY;  
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos_fixos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (baseadas em auth.uid())
DROP POLICY IF EXISTS "Admin full access usuarios" ON usuarios;
DROP POLICY IF EXISTS "Users can view their own data" ON usuarios;
DROP POLICY IF EXISTS "Gestores can view usuarios" ON usuarios;
DROP POLICY IF EXISTS "All can view espacos" ON espacos;
DROP POLICY IF EXISTS "Admin full access espacos" ON espacos;
DROP POLICY IF EXISTS "Gestores can manage assigned espacos" ON espacos;
DROP POLICY IF EXISTS "Users can view their agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can insert agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can update their pending agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Admin full access agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Gestores can manage agendamentos in their espacos" ON agendamentos;
DROP POLICY IF EXISTS "Admin full access agendamentos_fixos" ON agendamentos_fixos;
DROP POLICY IF EXISTS "Gestores can manage agendamentos_fixos in their espacos" ON agendamentos_fixos;
DROP POLICY IF EXISTS "All can view agendamentos_fixos" ON agendamentos_fixos;

-- NOVA ABORDAGEM: Políticas mais permissivas para sistema customizado
-- Como a autenticação é feita no frontend, precisamos de políticas mais abertas

-- OPÇÃO 1: RLS Básico (Recomendado para seu sistema)
-- Permite acesso a usuários autenticados, controle de acesso no frontend

CREATE POLICY "Allow authenticated access usuarios" ON usuarios
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated access espacos" ON espacos
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated access agendamentos" ON agendamentos
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated access agendamentos_fixos" ON agendamentos_fixos
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- OPÇÃO 2: RLS Mais Restritivo (Comentado - use se quiser mais segurança)
-- Descomente as linhas abaixo se quiser implementar controle mais granular

/*
-- Função auxiliar para verificar se usuário logado é admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Esta função precisaria ser implementada para verificar
  -- o usuário atual no contexto da aplicação
  -- Por enquanto, retorna true para permitir acesso
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas mais restritivas (descomentadas se necessário)
CREATE POLICY "Restricted usuarios access" ON usuarios
    FOR ALL TO authenticated
    USING (is_admin_user());

CREATE POLICY "Restricted espacos access" ON espacos
    FOR ALL TO authenticated
    USING (is_admin_user());
*/

-- Verificar se RLS foi habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado' 
        ELSE '❌ RLS Desabilitado' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('usuarios', 'espacos', 'agendamentos', 'agendamentos_fixos')
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
    schemaname, 
    tablename, 
    policyname,
    CASE 
        WHEN cmd = 'ALL' THEN '🔓 Acesso Total'
        WHEN cmd = 'SELECT' THEN '👁️ Apenas Leitura'
        WHEN cmd = 'INSERT' THEN '➕ Apenas Inserção'
        WHEN cmd = 'UPDATE' THEN '✏️ Apenas Atualização'
        WHEN cmd = 'DELETE' THEN '🗑️ Apenas Exclusão'
        ELSE cmd
    END as tipo_acesso
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- NOTA IMPORTANTE:
-- Com autenticação customizada, o RLS serve mais como uma camada de proteção básica
-- O controle de acesso principal deve ser feito no frontend/aplicação
-- As políticas acima permitem acesso a usuários autenticados no Supabase
-- mas o controle granular (admin/gestor/usuario) fica na aplicação 
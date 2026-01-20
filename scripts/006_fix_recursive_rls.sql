-- SCRIPT DE CORREÇÃO DE RLS (SEGURANÇA)
-- Execute este script no SQL Editor do Supabase para corrigir os bloqueios de carregamento (Infinite Loading)
-- e reativar a segurança correta.

-- 1. Desabilitar RLS temporariamente para garantir que comandos rodem sem bloqueio
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos_fixos DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas antigas (para limpar recursividade)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Gestores podem ver usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Qualquer um pode ver espacos" ON public.espacos;
DROP POLICY IF EXISTS "Admins podem gerenciar espacos" ON public.espacos;
DROP POLICY IF EXISTS "Agendamentos visiveis por dono" ON public.agendamentos;

-- 3. Re-habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos_fixos ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas NÃO-RECURSIVAS baseadas em Metadados (JWT)
-- O Truque: Em vez de checar a tabela 'usuarios' (que causa loop), checamos o token JWT do usuário logado.

--------------------------------------------------------------------------------
-- TABELA: USUARIOS
--------------------------------------------------------------------------------
-- Permitir leitura se for o próprio usuário OU se tiver claim de admin/gestor no JWT
CREATE POLICY "Leitura de Usuários" ON public.usuarios
FOR SELECT USING (
  auth.uid() = id OR 
  (auth.jwt() -> 'user_metadata' ->> 'tipo') IN ('admin', 'gestor')
);

-- Permitir update se for admin (pelo JWT) ou o próprio (para dados básicos)
CREATE POLICY "Update de Usuários" ON public.usuarios
FOR UPDATE USING (
  auth.uid() = id OR 
  (auth.jwt() -> 'user_metadata' ->> 'tipo') = 'admin'
);

-- Insert somente via trigger (auth.users -> public.usuarios) ou Admin
CREATE POLICY "Admin cria usuários" ON public.usuarios
FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'tipo') = 'admin'
);

-- Delete somente Admin
CREATE POLICY "Admin deleta usuários" ON public.usuarios
FOR DELETE USING (
  (auth.jwt() -> 'user_metadata' ->> 'tipo') = 'admin'
);

--------------------------------------------------------------------------------
-- TABELA: ESPACOS
--------------------------------------------------------------------------------
-- Leitura pública (todos logados)
CREATE POLICY "Leitura de Espaços" ON public.espacos
FOR SELECT TO authenticated USING (true);

-- Escrita somente Admin e Gestor
CREATE POLICY "Gestão de Espaços" ON public.espacos
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'tipo') IN ('admin', 'gestor')
);

--------------------------------------------------------------------------------
-- TABELA: AGENDAMENTOS
--------------------------------------------------------------------------------
-- Leitura: Próprio dono, Admin, ou Gestor do espaço
-- A parte do gestor ainda precisa consultar 'usuarios', mas vamos simplificar para evitar recursão:
-- Se sou gestor no JWT, vejo tudo (mais simples e performático por enquanto).
CREATE POLICY "Leitura de Agendamentos" ON public.agendamentos
FOR SELECT USING (
  auth.uid() = usuario_id OR 
  (auth.jwt() -> 'user_metadata' ->> 'tipo') IN ('admin', 'gestor')
);

-- Insert: Qualquer autenticado (validado no back/front)
CREATE POLICY "Criar Agendamento" ON public.agendamentos
FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Update/Delete: Dono (pendente), Admin ou Gestor
CREATE POLICY "Gerenciar Agendamento" ON public.agendamentos
FOR UPDATE USING (
  auth.uid() = usuario_id OR 
  (auth.jwt() -> 'user_metadata' ->> 'tipo') IN ('admin', 'gestor')
);

--------------------------------------------------------------------------------
-- TABELA: AGENDAMENTOS FIXOS
--------------------------------------------------------------------------------
CREATE POLICY "Leitura Agendamentos Fixos" ON public.agendamentos_fixos
FOR SELECT USING (true);

CREATE POLICY "Gestão Agendamentos Fixos" ON public.agendamentos_fixos
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'tipo') IN ('admin', 'gestor')
);

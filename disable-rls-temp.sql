-- Script para desabilitar RLS temporariamente durante desenvolvimento
-- Execute no Supabase Dashboard > SQL Editor

-- Desabilitar RLS em todas as tabelas
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE espacos DISABLE ROW LEVEL SECURITY;  
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos_fixos DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Para reabilitar depois (quando implementar autenticação):
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE espacos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agendamentos_fixos ENABLE ROW LEVEL SECURITY; 
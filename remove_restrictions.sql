-- Script para remover restrições do sistema de agendamento
-- Remove limite de 4 aulas e outras restrições desnecessárias

-- 1. Remover constraint de duração máxima de aulas da tabela agendamentos
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS aula_max_duration;

-- 2. Remover constraint de duração máxima caso exista na tabela agendamentos_fixos também
ALTER TABLE agendamentos_fixos DROP CONSTRAINT IF EXISTS aula_max_duration_fixo;

-- 3. Verificar se as constraints foram removidas
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'agendamentos'::regclass 
   OR conrelid = 'agendamentos_fixos'::regclass;

-- Comentário: Restrições de duração removidas com sucesso!
-- Agora é possível agendar quantas aulas consecutivas forem necessárias. 
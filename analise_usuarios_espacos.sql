-- Script para analisar a estrutura atual de usuários e espaços
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Listar TODOS os usuários do sistema
SELECT 
    id,
    nome,
    email,
    tipo,
    ativo,
    espacos,
    CASE 
        WHEN tipo = 'admin' THEN '🔴 ADMINISTRADOR (não deve receber emails de gestor)'
        WHEN tipo = 'gestor' THEN '🟢 GESTOR (deve receber emails)'
        ELSE '🔵 USUÁRIO COMUM'
    END as papel_sistema
FROM usuarios
ORDER BY tipo, nome;

-- 2. Listar TODOS os espaços disponíveis
SELECT 
    id,
    nome,
    capacidade,
    descricao,
    ativo
FROM espacos
ORDER BY id;

-- 3. Análise: Quem é gestor de qual espaço
SELECT 
    e.id as espaco_id,
    e.nome as espaco_nome,
    u.nome as gestor_nome,
    u.email as gestor_email,
    u.tipo,
    CASE 
        WHEN u.tipo = 'admin' THEN '⚠️ Admin (não deve receber notificações)'
        ELSE '✅ Gestor específico'
    END as status_notificacao
FROM espacos e
LEFT JOIN usuarios u ON u.espacos @> ARRAY[e.id]
WHERE u.tipo IN ('gestor', 'admin')
ORDER BY e.id, u.tipo, u.nome;

-- 4. Identificar espaços SEM gestores específicos (apenas admin)
SELECT 
    e.id,
    e.nome as espaco_nome,
    COUNT(CASE WHEN u.tipo = 'gestor' THEN 1 END) as total_gestores,
    COUNT(CASE WHEN u.tipo = 'admin' THEN 1 END) as total_admins,
    CASE 
        WHEN COUNT(CASE WHEN u.tipo = 'gestor' THEN 1 END) = 0 THEN '❌ SEM GESTOR - Precisa atribuir'
        ELSE '✅ OK - Tem gestor'
    END as status
FROM espacos e
LEFT JOIN usuarios u ON u.espacos @> ARRAY[e.id] AND u.tipo IN ('gestor', 'admin')
GROUP BY e.id, e.nome
ORDER BY e.id;

-- 5. Resumo final
SELECT 
    'Total de Espaços' as metrica,
    COUNT(*) as valor
FROM espacos
WHERE ativo = true
UNION ALL
SELECT 
    'Espaços com Gestores',
    COUNT(DISTINCT e.id)
FROM espacos e
JOIN usuarios u ON u.espacos @> ARRAY[e.id] AND u.tipo = 'gestor'
UNION ALL
SELECT 
    'Espaços SEM Gestores',
    COUNT(*)
FROM espacos e
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.espacos @> ARRAY[e.id] AND u.tipo = 'gestor'
)
UNION ALL
SELECT 
    'Total de Gestores',
    COUNT(*)
FROM usuarios
WHERE tipo = 'gestor'
UNION ALL
SELECT 
    'Total de Admins',
    COUNT(*)
FROM usuarios
WHERE tipo = 'admin';

-- 6. Proposta de correção: Criar gestores para espaços sem responsáveis
-- (Descomente e execute se necessário)
/*
-- Criar gestores específicos para cada espaço
INSERT INTO usuarios (id, nome, email, tipo, ativo, espacos) VALUES 
    (gen_random_uuid(), 'Gestor Auditório', 'gestor.auditorio@escola.com', 'gestor', true, ARRAY[1]),
    (gen_random_uuid(), 'Gestor Quadra', 'gestor.quadra@escola.com', 'gestor', true, ARRAY[2]),
    (gen_random_uuid(), 'Gestor Lab Informática', 'gestor.labinfo@escola.com', 'gestor', true, ARRAY[3]),
    (gen_random_uuid(), 'Gestor Lab Línguas', 'gestor.lablinguas@escola.com', 'gestor', true, ARRAY[4])
ON CONFLICT (email) DO UPDATE SET
    espacos = EXCLUDED.espacos,
    nome = EXCLUDED.nome;
*/ 
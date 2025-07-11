-- CONFIGURAÇÃO DEFINITIVA DE GESTORES
-- Execute no Supabase Dashboard > SQL Editor

-- ============================================
-- PASSO 1: ANÁLISE DA SITUAÇÃO ATUAL
-- ============================================

-- Ver todos os usuários e seus papéis
SELECT 
    nome,
    email,
    tipo,
    espacos,
    CASE 
        WHEN tipo = 'admin' THEN '🔴 ADMIN - Pode aprovar tudo, mas NÃO recebe emails'
        WHEN tipo = 'gestor' THEN '🟢 GESTOR - Recebe emails dos espaços que gerencia'
        ELSE '🔵 USUÁRIO - Apenas solicita agendamentos'
    END as papel_no_sistema
FROM usuarios
ORDER BY tipo, nome;

-- Ver quais espaços existem
SELECT id, nome, descricao FROM espacos ORDER BY id;

-- ============================================
-- PASSO 2: CRIAR GESTORES PARA CADA ESPAÇO
-- ============================================

-- Criar um gestor específico para cada espaço
-- AJUSTE os emails conforme necessário para sua escola

-- Gestor do Auditório
INSERT INTO usuarios (id, nome, email, tipo, ativo, espacos, senha) 
VALUES (
    gen_random_uuid(), 
    'Maria Silva - Gestor Auditório', 
    'maria.silva@escola.com', 
    'gestor', 
    true, 
    ARRAY[1], -- ID do Auditório
    '123456' -- senha padrão
)
ON CONFLICT (email) DO UPDATE SET
    espacos = EXCLUDED.espacos,
    nome = EXCLUDED.nome,
    tipo = 'gestor';

-- Gestor da Quadra Poliesportiva
INSERT INTO usuarios (id, nome, email, tipo, ativo, espacos, senha) 
VALUES (
    gen_random_uuid(), 
    'João Santos - Gestor Quadra', 
    'joao.santos@escola.com', 
    'gestor', 
    true, 
    ARRAY[2], -- ID da Quadra
    '123456'
)
ON CONFLICT (email) DO UPDATE SET
    espacos = EXCLUDED.espacos,
    nome = EXCLUDED.nome,
    tipo = 'gestor';

-- Gestor do Lab de Informática
INSERT INTO usuarios (id, nome, email, tipo, ativo, espacos, senha) 
VALUES (
    gen_random_uuid(), 
    'Ana Costa - Gestor Lab Info', 
    'ana.costa@escola.com', 
    'gestor', 
    true, 
    ARRAY[3], -- ID do Lab Info
    '123456'
)
ON CONFLICT (email) DO UPDATE SET
    espacos = EXCLUDED.espacos,
    nome = EXCLUDED.nome,
    tipo = 'gestor';

-- Gestor do Lab de Línguas
INSERT INTO usuarios (id, nome, email, tipo, ativo, espacos, senha) 
VALUES (
    gen_random_uuid(), 
    'Pedro Oliveira - Gestor Lab Línguas', 
    'pedro.oliveira@escola.com', 
    'gestor', 
    true, 
    ARRAY[4], -- ID do Lab Línguas
    '123456'
)
ON CONFLICT (email) DO UPDATE SET
    espacos = EXCLUDED.espacos,
    nome = EXCLUDED.nome,
    tipo = 'gestor';

-- ============================================
-- PASSO 3: VERIFICAR RESULTADO
-- ============================================

-- Verificar se cada espaço tem um gestor
SELECT 
    e.id,
    e.nome as espaco,
    string_agg(u.nome || ' (' || u.email || ')', ', ') as gestores_responsaveis,
    COUNT(CASE WHEN u.tipo = 'gestor' THEN 1 END) as total_gestores
FROM espacos e
LEFT JOIN usuarios u ON u.espacos @> ARRAY[e.id] AND u.tipo = 'gestor'
GROUP BY e.id, e.nome
ORDER BY e.id;

-- ============================================
-- PASSO 4: GARANTIR QUE ADMIN NÃO ESTÁ COMO GESTOR
-- ============================================

-- Remover espaços do admin (ele pode aprovar tudo, mas não deve receber emails)
UPDATE usuarios 
SET espacos = NULL 
WHERE tipo = 'admin';

-- ============================================
-- PASSO 5: RESUMO FINAL
-- ============================================

SELECT 
    '✅ CONFIGURAÇÃO CONCLUÍDA!' as status,
    'Cada espaço agora tem um gestor específico que receberá emails' as mensagem
UNION ALL
SELECT 
    '📧 Gestores criados:',
    string_agg(nome || ' (' || email || ')', ', ')
FROM usuarios 
WHERE tipo = 'gestor'
UNION ALL
SELECT 
    '🔴 Administradores:',
    string_agg(nome || ' - NÃO recebe emails de gestor', ', ')
FROM usuarios 
WHERE tipo = 'admin';

-- ============================================
-- INFORMAÇÕES IMPORTANTES:
-- ============================================
-- 1. Administradores podem aprovar QUALQUER agendamento
-- 2. Gestores só podem aprovar agendamentos dos seus espaços
-- 3. Apenas gestores recebem emails de novas solicitações
-- 4. Administradores NÃO recebem emails (evita spam)
-- 5. Ajuste os emails dos gestores conforme necessário 
-- Script para atualizar espaços do sistema
-- Remove espaços existentes e insere os novos conforme padrão definido

-- 1. Remover todos os espaços existentes
-- Primeiro removemos agendamentos relacionados para evitar erro de foreign key
DELETE FROM agendamentos WHERE espaco_id IN (SELECT id FROM espacos);
DELETE FROM agendamentos_fixos WHERE espaco_id IN (SELECT id FROM espacos);

-- Agora removemos os espaços
DELETE FROM espacos;

-- 2. Resetar a sequência do ID para começar do 1
ALTER SEQUENCE espacos_id_seq RESTART WITH 1;

-- 3. Inserir os novos espaços
INSERT INTO espacos (nome, capacidade, descricao, equipamentos, ativo) VALUES 
    (
        'Auditório', 
        180, 
        'Espaço amplo para eventos, palestras e apresentações', 
        ARRAY['Ar condicionado', 'Projetor', 'Som'],
        true
    ),
    (
        'Quadra Poliesportiva', 
        1000, 
        'Espaço esportivo para atividades físicas e eventos de grande porte', 
        NULL,
        true
    ),
    (
        'Laboratório de Informática', 
        45, 
        'Laboratório equipado com computadores para aulas práticas de tecnologia', 
        ARRAY['24 computadores', 'TV 65"', 'Ar condicionado'],
        true
    ),
    (
        'Laboratório de Línguas', 
        45, 
        'Laboratório para ensino de idiomas com recursos audiovisuais', 
        ARRAY['20 computadores', 'Projetor', 'Ar condicionado'],
        true
    ),
    (
        'Laboratório de Matemática', 
        45, 
        'Espaço dedicado ao ensino prático de matemática', 
        ARRAY['20 computadores', 'TV 40"', 'Ar condicionado'],
        true
    ),
    (
        'Laboratório de Física', 
        45, 
        'Laboratório para experimentos e aulas práticas de física', 
        ARRAY['Ar condicionado'],
        true
    ),
    (
        'Laboratório de Biologia', 
        45, 
        'Laboratório para estudos e experimentos biológicos', 
        ARRAY['Ar condicionado'],
        true
    ),
    (
        'Laboratório de Gestão e Negócios', 
        45, 
        'Espaço para simulações empresariais e estudos de gestão', 
        ARRAY['Ar condicionado'],
        true
    ),
    (
        'Laboratório de Química', 
        45, 
        'Laboratório equipado para experimentos químicos', 
        ARRAY['Ar condicionado'],
        true
    ),
    (
        'Biblioteca', 
        45, 
        'Espaço de estudos e consulta ao acervo bibliográfico', 
        ARRAY['Ar condicionado', 'Livros'],
        true
    );

-- 4. Verificar os dados inseridos
SELECT 
    id,
    nome,
    capacidade,
    descricao,
    equipamentos,
    ativo,
    created_at
FROM espacos 
ORDER BY id;

-- Comentário: Script executado com sucesso!
-- Total de espaços inseridos: 10 
-- Inserir usuários iniciais (com ON CONFLICT para evitar duplicação)
INSERT INTO usuarios (id, nome, email, tipo, ativo, espacos) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Administrador', 'admin@sistema.com', 'admin', true, NULL),
    ('550e8400-e29b-41d4-a716-446655440002', 'Gestor Principal', 'gestor@sistema.com', 'gestor', true, ARRAY[1, 2]),
    ('550e8400-e29b-41d4-a716-446655440003', 'João Silva', 'joao@email.com', 'usuario', true, NULL),
    ('550e8400-e29b-41d4-a716-446655440004', 'Maria Santos', 'maria@email.com', 'usuario', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- Inserir espaços
INSERT INTO espacos (id, nome, capacidade, descricao, equipamentos, ativo) VALUES 
    (1, 'Sala de Reunião A', 8, 'Sala com projetor e ar condicionado', ARRAY['Projetor', 'TV', 'Ar condicionado'], true),
    (2, 'Sala de Reunião B', 12, 'Sala ampla para apresentações', ARRAY['Projetor', 'Quadro branco', 'Sistema de som'], true),
    (3, 'Auditório', 50, 'Espaço para eventos e palestras', ARRAY['Projetor', 'Sistema de som', 'Microfone'], true),
    (4, 'Sala de Treinamento', 20, 'Sala para cursos e treinamentos', ARRAY['Projetor', 'Computadores'], true)
ON CONFLICT (id) DO NOTHING;

-- Reiniciar a sequência dos espaços para continuar do ID 5
SELECT setval('espacos_id_seq', 4, true);

-- Inserir alguns agendamentos de exemplo
INSERT INTO agendamentos (espaco_id, usuario_id, data, aula_inicio, aula_fim, status, observacoes) VALUES 
    (1, '550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 7, 8, 'pendente', 'Reunião de planejamento'),
    (2, '550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE + INTERVAL '1 day', 4, 5, 'aprovado', 'Apresentação do projeto')
ON CONFLICT (id) DO NOTHING;

-- Comentário para referência futura sobre os UUIDs:
-- 550e8400-e29b-41d4-a716-446655440001 = Admin
-- 550e8400-e29b-41d4-a716-446655440002 = Gestor
-- 550e8400-e29b-41d4-a716-446655440003 = João Silva
-- 550e8400-e29b-41d4-a716-446655440004 = Maria Santos 
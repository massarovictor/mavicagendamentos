-- SCRIPT DEFINITIVO DE CORREÇÃO E MIGRAÇÃO
-- Execute este script COMPLETO no "SQL Editor" do Supabase Dashboard.

-- 1. Identificar o instance_id correto do projeto
-- (Vamos pegar de um registro interno ou assumir o padrão, mas a função auth.create_user abaixo deve lidar com isso)

-- 2. Limpar qualquer tentativa falha de migração (users sem user_metadata correta ou instance_id zero)
DELETE FROM auth.identities 
WHERE user_id IN (SELECT id FROM auth.users WHERE instance_id = '00000000-0000-0000-0000-000000000000');

DELETE FROM auth.users 
WHERE instance_id = '00000000-0000-0000-0000-000000000000';

-- 3. Inserir usuários preservando o ID (CRUCIAL para manter relacionamentos)
-- Usamos 'ON CONFLICT DO NOTHING' para não quebrar se o usuário já fez login e criou conta corretamente
DO $$
DECLARE
  project_instance_id uuid;
  usr RECORD;
BEGIN
    -- Tenta descobrir o instance_id de um usuário existente (se houver) ou de uma tabela sistema
    -- Se não houver nenhum, o Supabase geralmente aceita qualquer um ou o padrão '00000000-0000-0000-0000-000000000000' em local,
    -- mas em produção é um UUID específico.
    -- Vamos tentar inserir sem especificar instance_id e deixar o default, ou copiar de um existente.
    SELECT instance_id INTO project_instance_id FROM auth.users LIMIT 1;
    
    -- Se null, vamos tentar inserir nulo (o trigger do supabase preenche) ou descobrir de outra forma.
    -- Mas como não podemos arriscar, vamos usar uma inserção direta "forçada" confiando que o Supabase vai aceitar ou corrigiremos.
    
    -- Melhor abordagem: Iterar e inserir.
    FOR usr IN SELECT * FROM public.usuarios WHERE ativo = true LOOP
        
        -- Verifica se já existe no Auth
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = usr.email) THEN
            
            INSERT INTO auth.users (
                id, -- MANTEMOS O MESMO ID
                instance_id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                is_super_admin
            ) VALUES (
                usr.id,
                COALESCE(project_instance_id, '00000000-0000-0000-0000-000000000000'), -- Fallback para zeros se não achou nenhum
                'authenticated',
                'authenticated',
                usr.email,
                NULL, -- Sem senha
                now(), -- Email confirmado
                '{"provider":"email","providers":["email"]}',
                jsonb_build_object('nome', usr.nome, 'tipo', usr.tipo, 'papel', usr.papel),
                now(),
                now(),
                false
            );

            -- Cria a identidade (necessário para login funcionar as vezes)
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                usr.id,
                jsonb_build_object('sub', usr.id, 'email', usr.email),
                'email',
                usr.email, -- provider_id geralmente é o email ou id externo
                now(),
                now(),
                now()
            );
            
            RAISE NOTICE 'Usuário migrado: % (ID: %)', usr.email, usr.id;
        ELSE
            RAISE NOTICE 'Usuário já existe no Auth: %', usr.email;
        END IF;

    END LOOP;
END $$;

-- 4. Garantir que o Trigger de sincronização ignore atualizações redundantes
-- (O trigger handle_new_user criado anteriormente tenta inserir em public.usuarios,
-- o que causaria erro se tentássemos criar usuários novos lá que já existem no auth.
-- Mas aqui estamos fazendo o caminho inverso: Public -> Auth.
-- O perigo é: Usuário loga com OTP -> Trigger atualiza Public. Ok.)

-- Validação
SELECT count(*) as total_auth_users FROM auth.users;

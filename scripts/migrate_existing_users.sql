-- Script para migrar usuários existentes para Supabase Auth
-- Execute APENAS UMA VEZ após configurar o Supabase Auth
-- ATENÇÃO: Execute no Supabase Dashboard > SQL Editor

-- Para cada usuário existente, criar entrada no auth.users
-- (sem senha - eles usarão OTP)

DO $$
DECLARE
  usr RECORD;
BEGIN
  FOR usr IN 
    SELECT id, email, nome, tipo, papel 
    FROM usuarios 
    WHERE ativo = true
  LOOP
    -- Inserir usuário no auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role
    )
    VALUES (
      usr.id,
      '00000000-0000-0000-0000-000000000000',
      usr.email,
      '', -- Sem senha (passwordless)
      NOW(), -- Email já confirmado
      jsonb_build_object(
        'nome', usr.nome, 
        'tipo', usr.tipo::text,
        'papel', COALESCE(usr.papel::text, 'professor')
      ),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Migrado: % (%)', usr.nome, usr.email;
  END LOOP;
END $$;

-- Criar identidades para os usuários migrados
INSERT INTO auth.identities (
  id, 
  user_id, 
  identity_data, 
  provider, 
  provider_id, 
  created_at, 
  updated_at,
  last_sign_in_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

-- Verificar migração
SELECT 'Migração concluída!' as status, COUNT(*) as usuarios_migrados FROM auth.users;

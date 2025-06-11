/*
  # Create demo user and ensure proper authentication flow

  1. Create demo user in auth.users
  2. Ensure profile is created
  3. Add sample data
*/

-- Função para criar usuário demo se não existir
DO $$
DECLARE
  demo_user_id uuid;
  demo_company_id uuid := '12345678-1234-1234-1234-123456789012';
BEGIN
  -- Verificar se usuário demo já existe
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'demo@unasyscrm.com.br';

  -- Se não existe, criar (isso normalmente seria feito via signup)
  IF demo_user_id IS NULL THEN
    -- Inserir usuário demo diretamente na tabela auth.users
    -- NOTA: Em produção, isso deve ser feito via auth.signup()
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'demo@unasyscrm.com.br',
      crypt('123456', gen_salt('bf')), -- senha: 123456
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Usuário Demo"}',
      false,
      '',
      '',
      '',
      ''
    ) RETURNING id INTO demo_user_id;

    RAISE NOTICE 'Usuário demo criado com ID: %', demo_user_id;
  ELSE
    RAISE NOTICE 'Usuário demo já existe com ID: %', demo_user_id;
  END IF;

  -- Garantir que o perfil existe
  INSERT INTO profiles (
    user_id,
    company_id,
    role,
    permissions,
    is_active
  ) VALUES (
    demo_user_id,
    demo_company_id,
    'admin',
    '{"clients": {"create": true, "read": true, "update": true, "delete": true}, "proposals": {"create": true, "read": true, "update": true, "delete": true}, "tasks": {"create": true, "read": true, "update": true, "delete": true}, "reports": {"create": true, "read": true, "update": true, "delete": false}}'::jsonb,
    true
  ) ON CONFLICT (user_id, company_id) DO NOTHING;

  RAISE NOTICE 'Perfil do usuário demo garantido';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar usuário demo: %', SQLERRM;
    -- Não falhar a migração se houver erro
END $$;

-- Verificar se todos os usuários têm perfil
DO $$
DECLARE
  user_record RECORD;
  demo_company_id uuid := '12345678-1234-1234-1234-123456789012';
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email
    FROM auth.users u 
    LEFT JOIN profiles p ON u.id = p.user_id 
    WHERE p.user_id IS NULL
  LOOP
    RAISE NOTICE 'Criando perfil para usuário órfão: % (%)', user_record.email, user_record.id;
    
    INSERT INTO profiles (
      user_id,
      company_id,
      role,
      permissions,
      is_active
    ) VALUES (
      user_record.id,
      demo_company_id,
      'admin',
      '{"clients": {"create": true, "read": true, "update": true, "delete": true}, "proposals": {"create": true, "read": true, "update": true, "delete": true}, "tasks": {"create": true, "read": true, "update": true, "delete": true}, "reports": {"create": true, "read": true, "update": true, "delete": false}}'::jsonb,
      true
    ) ON CONFLICT (user_id, company_id) DO NOTHING;
  END LOOP;
END $$;
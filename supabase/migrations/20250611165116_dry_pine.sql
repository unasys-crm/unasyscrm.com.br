/*
  # Create demo user for testing

  1. Create demo user in auth.users
  2. Ensure profile is created
  3. Set up proper permissions
*/

-- Função para criar usuário demo
DO $$
DECLARE
  demo_user_id uuid;
  demo_company_id uuid;
  demo_email text := 'demo@unasyscrm.com.br';
  demo_password text := 'demo123456';
BEGIN
  -- Buscar empresa demo
  SELECT id INTO demo_company_id
  FROM companies
  WHERE email = demo_email
  LIMIT 1;

  -- Se não existe empresa demo, criar
  IF demo_company_id IS NULL THEN
    INSERT INTO companies (
      name,
      email,
      phone,
      plan,
      status
    ) VALUES (
      'Empresa Demonstração',
      demo_email,
      '(11) 99999-9999',
      'professional',
      'active'
    ) RETURNING id INTO demo_company_id;
    
    RAISE NOTICE 'Empresa demo criada com ID: %', demo_company_id;
  END IF;

  -- Verificar se usuário demo já existe
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = demo_email;

  -- Se usuário não existe, criar
  IF demo_user_id IS NULL THEN
    -- Gerar ID para o usuário
    demo_user_id := gen_random_uuid();
    
    -- Inserir usuário demo
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
      demo_user_id,
      'authenticated',
      'authenticated',
      demo_email,
      crypt(demo_password, gen_salt('bf')),
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
    );

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
  ) ON CONFLICT (user_id, company_id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active;

  RAISE NOTICE 'Perfil do usuário demo garantido';

  -- Criar dados de exemplo se não existirem
  INSERT INTO clients (
    company_id,
    type,
    name,
    email,
    phone,
    status,
    category,
    created_by
  ) VALUES 
    (
      demo_company_id,
      'company',
      'Empresa ABC Ltda',
      'contato@empresaabc.com.br',
      '(11) 3333-4444',
      'active',
      'Cliente VIP',
      demo_user_id
    ),
    (
      demo_company_id,
      'individual',
      'João Silva',
      'joao.silva@email.com',
      '(11) 99999-8888',
      'prospect',
      'Prospect',
      demo_user_id
    ),
    (
      demo_company_id,
      'individual',
      'Maria Santos',
      'maria.santos@email.com',
      '(11) 98888-7777',
      'active',
      'Cliente',
      demo_user_id
    )
  ON CONFLICT (company_id, email) DO NOTHING;

  -- Criar tarefas de exemplo
  INSERT INTO tasks (
    company_id,
    title,
    description,
    status,
    priority,
    due_date,
    created_by
  ) VALUES 
    (
      demo_company_id,
      'Revisar proposta comercial',
      'Analisar e revisar a proposta enviada para o cliente ABC',
      'todo',
      'high',
      CURRENT_DATE + INTERVAL '3 days',
      demo_user_id
    ),
    (
      demo_company_id,
      'Ligar para prospect',
      'Entrar em contato com João Silva para apresentar nossos serviços',
      'in_progress',
      'medium',
      CURRENT_DATE + INTERVAL '1 day',
      demo_user_id
    ),
    (
      demo_company_id,
      'Preparar apresentação',
      'Criar apresentação para reunião com cliente',
      'todo',
      'medium',
      CURRENT_DATE + INTERVAL '5 days',
      demo_user_id
    )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Dados de exemplo criados para empresa demo';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao configurar usuário demo: %', SQLERRM;
END $$;
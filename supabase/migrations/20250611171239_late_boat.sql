/*
  # Confirmar usuário de demonstração

  1. Garantir que o usuário demo existe e está confirmado
  2. Criar perfil e dados de exemplo
  3. Configurar permissões adequadas
*/

-- Função para garantir que o usuário demo existe e está confirmado
DO $$
DECLARE
  demo_user_id uuid;
  demo_company_id uuid;
  demo_email text := 'demo@unasyscrm.com.br';
  demo_password text := 'demo123456';
  user_exists boolean := false;
BEGIN
  -- Verificar se usuário demo já existe
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = demo_email;

  IF demo_user_id IS NOT NULL THEN
    user_exists := true;
    RAISE NOTICE 'Usuário demo já existe com ID: %', demo_user_id;
    
    -- Garantir que está confirmado
    UPDATE auth.users 
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = demo_user_id;
    
    RAISE NOTICE 'Usuário demo confirmado';
  ELSE
    -- Criar usuário demo
    demo_user_id := gen_random_uuid();
    
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
      now(), -- Confirmado imediatamente
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

    RAISE NOTICE 'Usuário demo criado e confirmado com ID: %', demo_user_id;
  END IF;

  -- Garantir que a empresa demo existe
  SELECT id INTO demo_company_id
  FROM companies
  WHERE email = demo_email;

  IF demo_company_id IS NULL THEN
    INSERT INTO companies (
      id,
      name,
      email,
      phone,
      plan,
      status
    ) VALUES (
      '12345678-1234-1234-1234-123456789012',
      'Empresa Demonstração',
      demo_email,
      '(11) 99999-9999',
      'professional',
      'active'
    ) RETURNING id INTO demo_company_id;
    
    RAISE NOTICE 'Empresa demo criada com ID: %', demo_company_id;
  ELSE
    demo_company_id := '12345678-1234-1234-1234-123456789012';
    RAISE NOTICE 'Empresa demo já existe com ID: %', demo_company_id;
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

  -- Criar dados de exemplo apenas se não existirem
  INSERT INTO clients (
    company_id,
    type,
    name,
    email,
    phone,
    status,
    category,
    created_by
  ) 
  SELECT 
    demo_company_id,
    'company',
    'Empresa ABC Ltda',
    'contato@empresaabc.com.br',
    '(11) 3333-4444',
    'active',
    'Cliente VIP',
    demo_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE company_id = demo_company_id 
    AND email = 'contato@empresaabc.com.br'
  );

  INSERT INTO clients (
    company_id,
    type,
    name,
    email,
    phone,
    status,
    category,
    created_by
  ) 
  SELECT 
    demo_company_id,
    'individual',
    'João Silva',
    'joao.silva@email.com',
    '(11) 99999-8888',
    'prospect',
    'Prospect',
    demo_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE company_id = demo_company_id 
    AND email = 'joao.silva@email.com'
  );

  INSERT INTO clients (
    company_id,
    type,
    name,
    email,
    phone,
    status,
    category,
    created_by
  ) 
  SELECT 
    demo_company_id,
    'individual',
    'Maria Santos',
    'maria.santos@email.com',
    '(11) 98888-7777',
    'active',
    'Cliente',
    demo_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE company_id = demo_company_id 
    AND email = 'maria.santos@email.com'
  );

  -- Criar tarefas de exemplo
  INSERT INTO tasks (
    company_id,
    title,
    description,
    status,
    priority,
    due_date,
    created_by
  ) 
  SELECT 
    demo_company_id,
    'Revisar proposta comercial',
    'Analisar e revisar a proposta enviada para o cliente ABC',
    'todo',
    'high',
    CURRENT_DATE + INTERVAL '3 days',
    demo_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE company_id = demo_company_id 
    AND title = 'Revisar proposta comercial'
  );

  INSERT INTO tasks (
    company_id,
    title,
    description,
    status,
    priority,
    due_date,
    created_by
  ) 
  SELECT 
    demo_company_id,
    'Ligar para prospect',
    'Entrar em contato com João Silva para apresentar nossos serviços',
    'in_progress',
    'medium',
    CURRENT_DATE + INTERVAL '1 day',
    demo_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE company_id = demo_company_id 
    AND title = 'Ligar para prospect'
  );

  INSERT INTO tasks (
    company_id,
    title,
    description,
    status,
    priority,
    due_date,
    created_by
  ) 
  SELECT 
    demo_company_id,
    'Preparar apresentação',
    'Criar apresentação para reunião com cliente',
    'todo',
    'medium',
    CURRENT_DATE + INTERVAL '5 days',
    demo_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE company_id = demo_company_id 
    AND title = 'Preparar apresentação'
  );

  -- Criar proposta de exemplo
  INSERT INTO proposals (
    company_id,
    client_id,
    title,
    description,
    status,
    total_amount,
    items,
    valid_until,
    created_by
  )
  SELECT 
    demo_company_id,
    c.id,
    'Proposta de Desenvolvimento de Sistema',
    'Desenvolvimento de sistema web personalizado para gestão empresarial',
    'draft',
    15000.00,
    '[{"id": "1", "description": "Desenvolvimento Frontend", "quantity": 1, "unit_price": 8000.00, "total": 8000.00}, {"id": "2", "description": "Desenvolvimento Backend", "quantity": 1, "unit_price": 7000.00, "total": 7000.00}]'::jsonb,
    CURRENT_DATE + INTERVAL '30 days',
    demo_user_id
  FROM clients c
  WHERE c.company_id = demo_company_id 
  AND c.email = 'contato@empresaabc.com.br'
  AND NOT EXISTS (
    SELECT 1 FROM proposals 
    WHERE company_id = demo_company_id 
    AND title = 'Proposta de Desenvolvimento de Sistema'
  )
  LIMIT 1;

  RAISE NOTICE 'Configuração do usuário demo concluída com sucesso';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao configurar usuário demo: %', SQLERRM;
    -- Não falhar a migração
END $$;

-- Verificar status final
DO $$
DECLARE
  demo_user_id uuid;
  demo_email text := 'demo@unasyscrm.com.br';
  is_confirmed boolean;
  profile_count integer;
  client_count integer;
  task_count integer;
BEGIN
  -- Verificar usuário
  SELECT id, email_confirmed_at IS NOT NULL 
  INTO demo_user_id, is_confirmed
  FROM auth.users
  WHERE email = demo_email;

  IF demo_user_id IS NOT NULL THEN
    RAISE NOTICE 'Usuário demo encontrado: % (confirmado: %)', demo_user_id, is_confirmed;
    
    -- Verificar perfil
    SELECT COUNT(*) INTO profile_count
    FROM profiles
    WHERE user_id = demo_user_id;
    
    RAISE NOTICE 'Perfis encontrados: %', profile_count;
    
    -- Verificar dados de exemplo
    SELECT COUNT(*) INTO client_count
    FROM clients c
    JOIN profiles p ON c.company_id = p.company_id
    WHERE p.user_id = demo_user_id;
    
    SELECT COUNT(*) INTO task_count
    FROM tasks t
    JOIN profiles p ON t.company_id = p.company_id
    WHERE p.user_id = demo_user_id;
    
    RAISE NOTICE 'Dados de exemplo - Clientes: %, Tarefas: %', client_count, task_count;
  ELSE
    RAISE NOTICE 'ERRO: Usuário demo não foi criado!';
  END IF;
END $$;
/*
  # Criar perfil automaticamente no registro

  1. Função de trigger
    - Cria automaticamente um perfil quando um usuário se registra
    - Associa o usuário à empresa de demonstração ou permite criação de nova empresa
    - Define permissões padrão

  2. Trigger
    - Executa após inserção na tabela auth.users
    - Chama a função para criar o perfil

  3. Dados de demonstração
    - Garante que existe uma empresa demo
    - Cria dados de exemplo para novos usuários
*/

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  demo_company_id uuid;
  new_company_id uuid;
BEGIN
  -- Buscar a empresa de demonstração
  SELECT id INTO demo_company_id 
  FROM companies 
  WHERE email = 'demo@unasyscrm.com.br' 
  LIMIT 1;
  
  -- Se não encontrou empresa demo, criar uma
  IF demo_company_id IS NULL THEN
    INSERT INTO companies (
      name,
      email,
      phone,
      plan,
      status
    ) VALUES (
      'Empresa Demonstração',
      'demo@unasyscrm.com.br',
      '(11) 99999-9999',
      'professional',
      'active'
    ) RETURNING id INTO demo_company_id;
  END IF;
  
  -- Criar perfil para o novo usuário
  INSERT INTO profiles (
    user_id,
    company_id,
    role,
    permissions,
    is_active
  ) VALUES (
    NEW.id,
    demo_company_id,
    'admin', -- Primeiro usuário será admin
    '{"clients": {"create": true, "read": true, "update": true, "delete": true}, "proposals": {"create": true, "read": true, "update": true, "delete": true}, "tasks": {"create": true, "read": true, "update": true, "delete": true}, "reports": {"create": true, "read": true, "update": true, "delete": false}}'::jsonb,
    true
  ) ON CONFLICT (user_id, company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar ou recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Garantir que a empresa demo existe
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
  'demo@unasyscrm.com.br',
  '(11) 99999-9999',
  'professional',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status;

-- Criar dados de exemplo para usuários existentes que não têm perfil
DO $$
DECLARE
  demo_company_id uuid := '12345678-1234-1234-1234-123456789012';
  user_record RECORD;
BEGIN
  -- Para cada usuário que não tem perfil, criar um
  FOR user_record IN 
    SELECT u.id 
    FROM auth.users u 
    LEFT JOIN profiles p ON u.id = p.user_id 
    WHERE p.user_id IS NULL
  LOOP
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

  -- Criar dados de exemplo se não existirem
  -- Clientes de exemplo
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
    (SELECT id FROM auth.users LIMIT 1)
  WHERE NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE company_id = demo_company_id 
    AND email = 'contato@empresaabc.com.br'
  ) AND EXISTS (SELECT 1 FROM auth.users);

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
    (SELECT id FROM auth.users LIMIT 1)
  WHERE NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE company_id = demo_company_id 
    AND email = 'joao.silva@email.com'
  ) AND EXISTS (SELECT 1 FROM auth.users);

  -- Tarefas de exemplo
  INSERT INTO tasks (
    company_id,
    title,
    description,
    status,
    priority,
    created_by
  )
  SELECT 
    demo_company_id,
    'Revisar proposta comercial',
    'Analisar e revisar a proposta enviada para o cliente ABC',
    'todo',
    'high',
    (SELECT id FROM auth.users LIMIT 1)
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE company_id = demo_company_id 
    AND title = 'Revisar proposta comercial'
  ) AND EXISTS (SELECT 1 FROM auth.users);

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
    CURRENT_DATE + INTERVAL '3 days',
    (SELECT id FROM auth.users LIMIT 1)
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE company_id = demo_company_id 
    AND title = 'Ligar para prospect'
  ) AND EXISTS (SELECT 1 FROM auth.users);

  -- Proposta de exemplo
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
    (SELECT id FROM auth.users LIMIT 1)
  FROM clients c
  WHERE c.company_id = demo_company_id 
  AND c.email = 'contato@empresaabc.com.br'
  AND NOT EXISTS (
    SELECT 1 FROM proposals 
    WHERE company_id = demo_company_id 
    AND title = 'Proposta de Desenvolvimento de Sistema'
  ) AND EXISTS (SELECT 1 FROM auth.users)
  LIMIT 1;

END $$;
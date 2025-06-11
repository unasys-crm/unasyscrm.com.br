/*
  # Criar dados de demonstração

  1. Nova empresa de demonstração
    - Empresa com plano professional ativo
    - UUID gerado automaticamente

  2. Função para criar perfil automaticamente
    - Trigger que cria perfil quando usuário se registra
    - Primeiro usuário será admin da empresa demo

  3. Dados de exemplo
    - Clientes de demonstração
    - Tarefas de exemplo
    - Vinculados ao primeiro usuário quando existir
*/

-- Inserir empresa de demonstração com UUID gerado
INSERT INTO companies (
  id,
  name,
  email,
  phone,
  plan,
  status
) VALUES (
  gen_random_uuid(),
  'Empresa Demonstração',
  'demo@unasyscrm.com.br',
  '(11) 99999-9999',
  'professional',
  'active'
) ON CONFLICT DO NOTHING;

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  demo_company_id uuid;
BEGIN
  -- Buscar a empresa de demonstração
  SELECT id INTO demo_company_id 
  FROM companies 
  WHERE email = 'demo@unasyscrm.com.br' 
  LIMIT 1;
  
  -- Se encontrou a empresa demo, criar perfil
  IF demo_company_id IS NOT NULL THEN
    INSERT INTO profiles (user_id, company_id, role, is_active)
    VALUES (
      NEW.id,
      demo_company_id,
      'admin', -- Primeiro usuário será admin
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Inserir alguns dados de exemplo
DO $$
DECLARE
  demo_user_id uuid;
  demo_company_id uuid;
  client1_id uuid;
  client2_id uuid;
  client3_id uuid;
BEGIN
  -- Buscar a empresa de demonstração
  SELECT id INTO demo_company_id 
  FROM companies 
  WHERE email = 'demo@unasyscrm.com.br' 
  LIMIT 1;
  
  -- Buscar o primeiro usuário (se existir)
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
  
  IF demo_user_id IS NOT NULL AND demo_company_id IS NOT NULL THEN
    -- Inserir clientes de exemplo
    INSERT INTO clients (
      id,
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
      gen_random_uuid(),
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
      gen_random_uuid(),
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
      gen_random_uuid(),
      demo_company_id,
      'company',
      'Tech Solutions S.A.',
      'vendas@techsolutions.com.br',
      '(11) 2222-3333',
      'active',
      'Parceiro',
      demo_user_id
    ) ON CONFLICT DO NOTHING;

    -- Inserir algumas tarefas de exemplo
    INSERT INTO tasks (
      id,
      company_id,
      title,
      description,
      status,
      priority,
      assigned_to,
      due_date,
      created_by
    ) VALUES 
    (
      gen_random_uuid(),
      demo_company_id,
      'Entrar em contato com novo prospect',
      'Ligar para João Silva para apresentar nossos serviços',
      'todo',
      'high',
      demo_user_id,
      CURRENT_DATE + INTERVAL '2 days',
      demo_user_id
    ),
    (
      gen_random_uuid(),
      demo_company_id,
      'Preparar proposta comercial',
      'Elaborar proposta para Empresa ABC Ltda',
      'in_progress',
      'medium',
      demo_user_id,
      CURRENT_DATE + INTERVAL '5 days',
      demo_user_id
    ),
    (
      gen_random_uuid(),
      demo_company_id,
      'Revisar contrato',
      'Revisar contrato da Tech Solutions',
      'review',
      'low',
      demo_user_id,
      CURRENT_DATE + INTERVAL '7 days',
      demo_user_id
    ) ON CONFLICT DO NOTHING;

    -- Inserir algumas propostas de exemplo
    INSERT INTO proposals (
      id,
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
      gen_random_uuid(),
      demo_company_id,
      c.id,
      'Proposta de Serviços - ' || c.name,
      'Proposta comercial para prestação de serviços',
      'draft',
      15000.00,
      '[{"id": "1", "description": "Consultoria especializada", "quantity": 1, "unit_price": 15000.00, "total": 15000.00}]'::jsonb,
      CURRENT_DATE + INTERVAL '30 days',
      demo_user_id
    FROM clients c 
    WHERE c.company_id = demo_company_id 
    AND c.type = 'company'
    LIMIT 2
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
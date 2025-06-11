/*
  # Dados de demonstração

  1. Empresa de demonstração
  2. Usuário administrador
  3. Clientes de exemplo
  4. Tarefas de exemplo

  Nota: Este script deve ser executado após a criação do usuário no Supabase Auth
*/

-- Inserir empresa de demonstração
INSERT INTO companies (
  id,
  name,
  email,
  phone,
  plan,
  status
) VALUES (
  'demo-company-uuid',
  'Empresa Demonstração',
  'demo@unasyscrm.com.br',
  '(11) 99999-9999',
  'professional',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil na empresa de demonstração para novos usuários
  INSERT INTO profiles (user_id, company_id, role, is_active)
  VALUES (
    NEW.id,
    'demo-company-uuid',
    'admin', -- Primeiro usuário será admin
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Inserir alguns clientes de exemplo (será executado quando houver um usuário)
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Buscar o primeiro usuário (se existir)
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
  
  IF demo_user_id IS NOT NULL THEN
    -- Inserir clientes de exemplo
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
      'demo-company-uuid',
      'company',
      'Empresa ABC Ltda',
      'contato@empresaabc.com.br',
      '(11) 3333-4444',
      'active',
      'Cliente VIP',
      demo_user_id
    ),
    (
      'demo-company-uuid',
      'individual',
      'João Silva',
      'joao.silva@email.com',
      '(11) 99999-8888',
      'prospect',
      'Prospect',
      demo_user_id
    ),
    (
      'demo-company-uuid',
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
      'demo-company-uuid',
      'Entrar em contato com novo prospect',
      'Ligar para João Silva para apresentar nossos serviços',
      'todo',
      'high',
      demo_user_id,
      CURRENT_DATE + INTERVAL '2 days',
      demo_user_id
    ),
    (
      'demo-company-uuid',
      'Preparar proposta comercial',
      'Elaborar proposta para Empresa ABC Ltda',
      'in_progress',
      'medium',
      demo_user_id,
      CURRENT_DATE + INTERVAL '5 days',
      demo_user_id
    ),
    (
      'demo-company-uuid',
      'Revisar contrato',
      'Revisar contrato da Tech Solutions',
      'review',
      'low',
      demo_user_id,
      CURRENT_DATE + INTERVAL '7 days',
      demo_user_id
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;
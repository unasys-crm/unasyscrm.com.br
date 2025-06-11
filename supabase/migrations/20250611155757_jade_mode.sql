/*
  # Fix Authentication Setup and Demo Data

  1. Database Changes
    - Update user profile creation trigger function
    - Ensure demo company exists with proper UUID
    - Create sample data for demonstration

  2. Security
    - Maintain RLS policies
    - Use SECURITY DEFINER for trigger function

  3. Demo Data
    - Create demo company with valid UUID
    - Add sample clients for testing
*/

-- Update the trigger function to be more robust
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
    )
    ON CONFLICT (user_id, company_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Ensure demo company exists with proper UUID
INSERT INTO companies (
  id,
  name,
  email,
  phone,
  plan,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
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

-- Create sample data for demonstration
DO $$
DECLARE
  demo_company_id uuid := '550e8400-e29b-41d4-a716-446655440000'::uuid;
  sample_user_id uuid;
BEGIN
  -- Get any existing user ID for created_by field, or use demo company id as fallback
  SELECT id INTO sample_user_id 
  FROM auth.users 
  LIMIT 1;
  
  -- If no users exist yet, use the demo company id as fallback
  IF sample_user_id IS NULL THEN
    sample_user_id := demo_company_id;
  END IF;

  -- Insert sample clients if they don't exist
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
    sample_user_id
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
    sample_user_id
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
    '(11) 88888-7777',
    'active',
    'Cliente Regular',
    sample_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE company_id = demo_company_id 
    AND email = 'maria.santos@email.com'
  );

  -- Insert sample tasks
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
    'Revisar e ajustar proposta para o cliente ABC',
    'todo',
    'high',
    CURRENT_DATE + INTERVAL '3 days',
    sample_user_id
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
    'Ligar para cliente João',
    'Fazer follow-up da reunião da semana passada',
    'in_progress',
    'medium',
    CURRENT_DATE + INTERVAL '1 day',
    sample_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE company_id = demo_company_id 
    AND title = 'Ligar para cliente João'
  );

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
    'Atualizar CRM',
    'Inserir novos contatos no sistema',
    'done',
    'low',
    sample_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE company_id = demo_company_id 
    AND title = 'Atualizar CRM'
  );

END $$;
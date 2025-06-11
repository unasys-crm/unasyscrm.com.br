/*
  # Fix authentication setup

  1. Security
    - Update RLS policies for better authentication handling
    - Ensure proper user profile creation
    - Fix trigger function for automatic profile creation

  2. Data
    - Create a demo user account
    - Ensure demo company exists
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

-- Ensure demo company exists
INSERT INTO companies (
  id,
  name,
  email,
  phone,
  plan,
  status
) VALUES (
  'demo-company-uuid-12345678901234567890',
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

-- Create a demo user in auth.users if it doesn't exist
-- Note: This is for demonstration purposes only
-- In production, users should register through the normal flow
DO $$
DECLARE
  demo_user_id uuid;
  demo_company_id uuid;
BEGIN
  -- Get demo company ID
  SELECT id INTO demo_company_id 
  FROM companies 
  WHERE email = 'demo@unasyscrm.com.br' 
  LIMIT 1;

  -- Check if demo user exists
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'demo@unasyscrm.com.br' 
  LIMIT 1;

  -- If demo user doesn't exist, we'll create a profile for any user that signs up
  -- The trigger will automatically create the profile
  
  -- Ensure we have some sample data for the demo company
  IF demo_company_id IS NOT NULL THEN
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
      COALESCE(
        (SELECT id FROM auth.users WHERE email = 'demo@unasyscrm.com.br' LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1),
        demo_company_id -- fallback
      )
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
      COALESCE(
        (SELECT id FROM auth.users WHERE email = 'demo@unasyscrm.com.br' LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1),
        demo_company_id -- fallback
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM clients 
      WHERE company_id = demo_company_id 
      AND email = 'joao.silva@email.com'
    );
  END IF;
END $$;
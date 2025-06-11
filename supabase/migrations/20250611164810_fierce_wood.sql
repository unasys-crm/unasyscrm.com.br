/*
  # Fix authentication flow and user profile creation

  1. Database Setup
    - Ensure demo company exists
    - Fix user profile creation trigger
    - Create profiles for existing users
  
  2. Security
    - Update RLS policies
    - Ensure proper permissions
*/

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

-- Função melhorada para criar perfil de usuário
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  demo_company_id uuid := '12345678-1234-1234-1234-123456789012';
BEGIN
  -- Log para debug
  RAISE LOG 'Creating profile for user: %', NEW.id;
  
  -- Criar perfil para o novo usuário na empresa demo
  INSERT INTO profiles (
    user_id,
    company_id,
    role,
    permissions,
    is_active
  ) VALUES (
    NEW.id,
    demo_company_id,
    'admin',
    '{"clients": {"create": true, "read": true, "update": true, "delete": true}, "proposals": {"create": true, "read": true, "update": true, "delete": true}, "tasks": {"create": true, "read": true, "update": true, "delete": true}, "reports": {"create": true, "read": true, "update": true, "delete": false}}'::jsonb,
    true
  ) ON CONFLICT (user_id, company_id) DO NOTHING;
  
  RAISE LOG 'Profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Não falhar a criação do usuário se houver erro no perfil
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Criar perfis para usuários existentes que não têm perfil
DO $$
DECLARE
  demo_company_id uuid := '12345678-1234-1234-1234-123456789012';
  user_record RECORD;
  profile_count INTEGER;
BEGIN
  -- Contar usuários sem perfil
  SELECT COUNT(*) INTO profile_count
  FROM auth.users u 
  LEFT JOIN profiles p ON u.id = p.user_id 
  WHERE p.user_id IS NULL;

  RAISE NOTICE 'Encontrados % usuários sem perfil', profile_count;

  -- Criar perfis para usuários sem perfil
  FOR user_record IN 
    SELECT u.id, u.email
    FROM auth.users u 
    LEFT JOIN profiles p ON u.id = p.user_id 
    WHERE p.user_id IS NULL
  LOOP
    RAISE NOTICE 'Criando perfil para usuário: % (%)', user_record.email, user_record.id;
    
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

  -- Verificar novamente
  SELECT COUNT(*) INTO profile_count
  FROM auth.users u 
  LEFT JOIN profiles p ON u.id = p.user_id 
  WHERE p.user_id IS NULL;

  RAISE NOTICE 'Usuários ainda sem perfil: %', profile_count;

END $$;

-- Verificar e corrigir políticas RLS
-- Política para profiles
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
CREATE POLICY "Users can view their own profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage profiles in their companies" ON profiles;
CREATE POLICY "Admins can manage profiles in their companies"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT p.company_id
      FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
      AND p.is_active = true
    )
  );

-- Política para companies
DROP POLICY IF EXISTS "Users can view companies they belong to" ON companies;
CREATE POLICY "Users can view companies they belong to"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT p.company_id
      FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_active = true
    )
  );

-- Criar alguns dados de exemplo se não existirem
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
  '12345678-1234-1234-1234-123456789012',
  'company',
  'Empresa ABC Ltda',
  'contato@empresaabc.com.br',
  '(11) 3333-4444',
  'active',
  'Cliente VIP',
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM clients 
  WHERE company_id = '12345678-1234-1234-1234-123456789012'
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
  '12345678-1234-1234-1234-123456789012',
  'individual',
  'Maria Santos',
  'maria.santos@email.com',
  '(11) 98888-7777',
  'prospect',
  'Prospect',
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM clients 
  WHERE company_id = '12345678-1234-1234-1234-123456789012'
  AND email = 'maria.santos@email.com'
) AND EXISTS (SELECT 1 FROM auth.users);
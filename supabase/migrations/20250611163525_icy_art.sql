/*
  # Debug e correção de perfis de usuário

  1. Verificar usuários sem perfil
  2. Criar perfis para usuários existentes
  3. Garantir que a empresa demo existe
  4. Verificar e corrigir dados
*/

-- Verificar usuários sem perfil
DO $$
DECLARE
  demo_company_id uuid;
  user_record RECORD;
  profile_count INTEGER;
BEGIN
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

  demo_company_id := '12345678-1234-1234-1234-123456789012';

  -- Contar usuários sem perfil
  SELECT COUNT(*) INTO profile_count
  FROM auth.users u 
  LEFT JOIN profiles p ON u.id = p.user_id 
  WHERE p.user_id IS NULL;

  RAISE NOTICE 'Usuários sem perfil: %', profile_count;

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

  -- Verificar se todos os usuários agora têm perfil
  SELECT COUNT(*) INTO profile_count
  FROM auth.users u 
  LEFT JOIN profiles p ON u.id = p.user_id 
  WHERE p.user_id IS NULL;

  RAISE NOTICE 'Usuários ainda sem perfil após correção: %', profile_count;

END $$;
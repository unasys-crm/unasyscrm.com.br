/*
  # Schema inicial do UnasyCRM

  1. Novas Tabelas
    - `companies` - Empresas do sistema
    - `profiles` - Perfis de usuários por empresa
    - `clients` - Clientes das empresas
    - `proposals` - Propostas comerciais
    - `tasks` - Tarefas e atividades
    - `notifications` - Notificações do sistema

  2. Segurança
    - Habilita RLS em todas as tabelas
    - Políticas de acesso baseadas em empresa
    - Isolamento de dados entre empresas
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  document text,
  address text,
  city text,
  state text,
  zip_code text,
  plan text NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'professional', 'enterprise')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de perfis (relaciona usuários com empresas)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'company')),
  name text NOT NULL,
  email text,
  phone text,
  document text,
  address text,
  city text,
  state text,
  zip_code text,
  category text,
  status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('active', 'inactive', 'prospect')),
  notes text,
  custom_fields jsonb DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de propostas
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired')),
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  discount decimal(10,2) DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]',
  valid_until date,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users(id),
  due_date date,
  client_id uuid REFERENCES clients(id),
  proposal_id uuid REFERENCES proposals(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para companies
CREATE POLICY "Users can view companies they belong to"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can update their companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Políticas para profiles
CREATE POLICY "Users can view their own profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage profiles in their companies"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- Políticas para clients
CREATE POLICY "Users can manage clients in their companies"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Políticas para proposals
CREATE POLICY "Users can manage proposals in their companies"
  ON proposals
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Políticas para tasks
CREATE POLICY "Users can manage tasks in their companies"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
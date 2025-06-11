/*
  # Fix Foreign Key Constraints for User Deletion

  1. Problem
    - When deleting users, foreign key constraints prevent deletion due to references in clients, tasks, proposals tables
    - Error: "update or delete on table "users" violates foreign key constraint"

  2. Solution
    - Update foreign key constraints to use CASCADE or SET NULL on delete
    - This allows user deletion while preserving data integrity
    - For created_by fields, we'll set them to NULL when user is deleted
    - For assigned_to fields, we'll also set them to NULL

  3. Changes
    - Drop existing foreign key constraints
    - Recreate them with proper ON DELETE behavior
    - Update existing NULL values to maintain data consistency
*/

-- First, let's handle the clients table
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_created_by_fkey;

-- Recreate the constraint with SET NULL on delete
ALTER TABLE clients 
ADD CONSTRAINT clients_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Handle the tasks table
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- Recreate constraints with SET NULL on delete
ALTER TABLE tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Handle the proposals table
ALTER TABLE proposals 
DROP CONSTRAINT IF EXISTS proposals_created_by_fkey;

-- Recreate the constraint with SET NULL on delete
ALTER TABLE proposals 
ADD CONSTRAINT proposals_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Handle the notifications table
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- For notifications, we want to CASCADE delete since notifications are user-specific
ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Handle the profiles table - this should CASCADE since profiles are user-specific
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes to improve performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);

-- Update any existing records that might have invalid foreign key references
-- This shouldn't be necessary with proper constraints, but it's a safety measure
UPDATE clients SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = clients.created_by);

UPDATE tasks SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = tasks.created_by);

UPDATE tasks SET assigned_to = NULL 
WHERE assigned_to IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = tasks.assigned_to);

UPDATE proposals SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = proposals.created_by);

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints updated successfully';
  RAISE NOTICE 'Users can now be deleted without constraint violations';
  RAISE NOTICE 'Related records will have created_by/assigned_to set to NULL';
  RAISE NOTICE 'User-specific records (profiles, notifications) will be deleted';
END $$;
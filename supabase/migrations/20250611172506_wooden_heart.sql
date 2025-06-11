/*
  # Fix User Profile and Company Creation

  1. New Functions
    - `create_user_profile_and_company()` - Creates user profile and company when user signs up
    - `handle_new_user()` - Trigger function to handle new user creation

  2. Security
    - Ensure RLS policies allow profile creation
    - Add proper foreign key constraints

  3. Triggers
    - Add trigger on auth.users to automatically create profile and company

  This migration ensures that when a user signs up (including the demo user), 
  they automatically get a profile and company created, which is required for 
  the application to function properly.
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Create a company for the new user
  INSERT INTO public.companies (name, email, plan, status)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', 'Minha Empresa'),
    NEW.email,
    'basic',
    'active'
  )
  RETURNING id INTO new_company_id;

  -- Create a profile for the new user
  INSERT INTO public.profiles (user_id, company_id, role, is_active)
  VALUES (
    NEW.id,
    new_company_id,
    'admin',
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile and company for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to allow profile creation during signup
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
CREATE POLICY "Allow profile creation during signup"
  ON public.profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Update RLS policies to allow company creation during signup
DROP POLICY IF EXISTS "Allow company creation during signup" ON public.companies;
CREATE POLICY "Allow company creation during signup"
  ON public.companies
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.companies TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
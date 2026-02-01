-- TaskOrgApp Database Schema
-- Run this in your Supabase SQL Editor
-- WARNING: This will DROP existing tables

-- ===========================================
-- CLEANUP: Drop existing tables if they exist
-- ===========================================

DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS environment_invitations CASCADE;
DROP TABLE IF EXISTS environment_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===========================================
-- CREATE TABLES
-- ===========================================

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  effort TEXT NOT NULL DEFAULT 'm' CHECK (effort IN ('xs', 's', 'm', 'l', 'xl')),
  urgent INTEGER NOT NULL DEFAULT 3 CHECK (urgent >= 1 AND urgent <= 5),
  important INTEGER NOT NULL DEFAULT 3 CHECK (important >= 1 AND important <= 5),
  due_date TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  icon TEXT DEFAULT NULL,
  first_step TEXT DEFAULT NULL,
  completion_criteria TEXT DEFAULT NULL,
  location TEXT DEFAULT NULL,
  location_lat DECIMAL(10, 8) DEFAULT NULL,
  location_lng DECIMAL(11, 8) DEFAULT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table (for gamification/leaderboard)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  points INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id, date)
);

-- ===========================================
-- INDEXES for better performance
-- ===========================================

CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_tasks_organization ON tasks(organization_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_scores_organization ON scores(organization_id);
CREATE INDEX idx_scores_user ON scores(user_id);
CREATE INDEX idx_scores_date ON scores(date);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HELPER FUNCTION: Get current user's organization
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
-- ===========================================

CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===========================================
-- ORGANIZATIONS POLICIES
-- ===========================================

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = get_my_organization_id());

-- Users can update their own organization (admin only)
CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id = get_my_organization_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow inserting organizations (for signup)
CREATE POLICY "Allow organization creation"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- ===========================================
-- PROFILES POLICIES
-- ===========================================

-- Users can view their own profile or profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR organization_id = get_my_organization_id()
  );

-- Allow inserting profiles (for signup and member addition)
CREATE POLICY "Allow profile creation"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins can update profiles in their organization
CREATE POLICY "Admins can update profiles in their organization"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid() OR (
      organization_id = get_my_organization_id() AND
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- ===========================================
-- TASKS POLICIES
-- ===========================================

-- Users can view tasks in their organization
CREATE POLICY "Users can view tasks in their organization"
  ON tasks FOR SELECT
  USING (organization_id = get_my_organization_id());

-- Users can create tasks in their organization
CREATE POLICY "Users can create tasks in their organization"
  ON tasks FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

-- Users can update tasks in their organization
CREATE POLICY "Users can update tasks in their organization"
  ON tasks FOR UPDATE
  USING (organization_id = get_my_organization_id());

-- Users can delete tasks in their organization
CREATE POLICY "Users can delete tasks in their organization"
  ON tasks FOR DELETE
  USING (organization_id = get_my_organization_id());

-- ===========================================
-- SCORES POLICIES
-- ===========================================

-- Users can view scores in their organization
CREATE POLICY "Users can view scores in their organization"
  ON scores FOR SELECT
  USING (organization_id = get_my_organization_id());

-- Users can insert/update their own scores
CREATE POLICY "Users can create scores"
  ON scores FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can update their scores"
  ON scores FOR UPDATE
  USING (user_id = auth.uid());

-- ===========================================
-- REALTIME SUBSCRIPTIONS
-- ===========================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;

-- ===========================================
-- HELPER FUNCTION: Check organization member limit
-- ===========================================

CREATE OR REPLACE FUNCTION check_organization_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
BEGIN
  -- Count existing members in the organization
  SELECT COUNT(*) INTO member_count
  FROM profiles
  WHERE organization_id = NEW.organization_id;

  -- Allow if under the member limit
  IF member_count >= 3 THEN
    RAISE EXCEPTION 'Organization can have maximum 3 members';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce 3-member limit
CREATE TRIGGER enforce_member_limit
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_organization_member_limit();

-- ===========================================
-- MIGRATION: Add new task columns (run if upgrading existing database)
-- ===========================================
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS first_step TEXT DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_criteria TEXT DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8) DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8) DEFAULT NULL;

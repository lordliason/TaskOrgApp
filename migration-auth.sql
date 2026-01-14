-- Migration script to add authentication tables
-- Run this in Supabase SQL Editor

-- Create organizations table (if not exists)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id to tasks table if not exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Enable Row Level Security for new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
DROP POLICY IF EXISTS "Allow all operations on organizations" ON organizations;
CREATE POLICY "Allow all operations on organizations" ON organizations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create policies for users
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert default organization
INSERT INTO organizations (id, name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Mario Maria Organization')
ON CONFLICT (name) DO NOTHING;

-- Insert default users (password: Montreal013122!)
-- Password hash is SHA-256 of 'Montreal013122!'
INSERT INTO users (id, username, password_hash, organization_id, display_name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'mario', '61f12e5d2421c99479928836e7a20410100106e98d5ae985487f83e93cd1c6f3', '550e8400-e29b-41d4-a716-446655440000', 'Mario'),
('550e8400-e29b-41d4-a716-446655440002', 'maria', '61f12e5d2421c99479928836e7a20410100106e98d5ae985487f83e93cd1c6f3', '550e8400-e29b-41d4-a716-446655440000', 'Maria')
ON CONFLICT (username) DO NOTHING;

-- Migrate existing tasks to default organization
UPDATE tasks SET organization_id = '550e8400-e29b-41d4-a716-446655440000' WHERE organization_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);


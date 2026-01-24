-- Migration to Multi-Environment User System
-- Run this in Supabase SQL Editor after running setup.sql
-- This transforms the single-organization system to support multiple environments

-- ===========================================
-- STEP 1: ADD EMAIL TO USERS TABLE
-- ===========================================

-- Add email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Update existing users with their email addresses
UPDATE users SET email = 'mario.seddik@gmail.com' WHERE username = 'mario';
UPDATE users SET email = 'maria.k.mikhail@gmail.com' WHERE username = 'maria';

-- Make email NOT NULL after migration
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- ===========================================
-- STEP 2: ADD OWNER_ID TO ORGANIZATIONS
-- ===========================================

-- Add owner_id to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Set Mario as the owner of the default organization
UPDATE organizations
SET owner_id = (SELECT id FROM users WHERE username = 'mario')
WHERE name = 'Mario Maria Organization';

-- ===========================================
-- STEP 3: CREATE ENVIRONMENT_MEMBERS JUNCTION TABLE
-- ===========================================

-- Create environment_members table for many-to-many relationship
CREATE TABLE IF NOT EXISTS environment_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,  -- User's display name within this environment
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Enable Row Level Security
ALTER TABLE environment_members ENABLE ROW LEVEL SECURITY;

-- Create policies for environment_members
CREATE POLICY "Allow all operations on environment_members" ON environment_members
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable realtime for environment_members
ALTER PUBLICATION supabase_realtime ADD TABLE environment_members;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_environment_members_user_id ON environment_members(user_id);
CREATE INDEX IF NOT EXISTS idx_environment_members_organization_id ON environment_members(organization_id);

-- ===========================================
-- STEP 4: MIGRATE EXISTING USERS TO ENVIRONMENT_MEMBERS
-- ===========================================

-- Insert existing users into environment_members
INSERT INTO environment_members (user_id, organization_id, display_name)
SELECT
    u.id,
    u.organization_id,
    u.display_name
FROM users u
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- ===========================================
-- STEP 5: UPDATE TASKS ASSIGNEE SYSTEM
-- ===========================================

-- Add assignee_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id);

-- Drop the old constraint first to allow data updates
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_check;

-- Migrate existing assignee values to assignee_id
UPDATE tasks SET assignee_id = (
    CASE
        WHEN assignee = 'mario' THEN (SELECT id FROM users WHERE username = 'mario')
        WHEN assignee = 'maria' THEN (SELECT id FROM users WHERE username = 'maria')
        WHEN assignee = 'both' THEN NULL  -- Will handle 'both' separately
        ELSE NULL
    END
) WHERE assignee_id IS NULL;

-- Update assignee column for backward compatibility
-- Convert 'both' to 'all', and ensure any other invalid values are handled
UPDATE tasks SET assignee = 'all' WHERE assignee = 'both';
-- Ensure all tasks have either 'all' as assignee or a valid assignee_id
UPDATE tasks SET assignee = 'all' WHERE assignee NOT IN ('all') AND assignee_id IS NULL;

-- Update the check constraint to allow dynamic assignees
ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_check CHECK (
    assignee = 'all' OR
    assignee_id IS NOT NULL
);

-- ===========================================
-- STEP 6: UPDATE SCORES SYSTEM
-- ===========================================

-- Add user_id to scores table if not exists
ALTER TABLE scores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Migrate existing player values to user_id
UPDATE scores SET user_id = (
    CASE
        WHEN player = 'mario' THEN (SELECT id FROM users WHERE username = 'mario')
        WHEN player = 'maria' THEN (SELECT id FROM users WHERE username = 'maria')
        ELSE NULL
    END
) WHERE user_id IS NULL;

-- Make user_id NOT NULL for future scores
-- (existing data might have NULL, but new scores should have user_id)

-- ===========================================
-- STEP 7: CREATE INVITATIONS SYSTEM
-- ===========================================

-- Create environment_invitations table for pending invites
CREATE TABLE IF NOT EXISTS environment_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    display_name TEXT NOT NULL,  -- Suggested display name for the invitee
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(organization_id, email, status)  -- Prevent duplicate pending invites
);

-- Enable Row Level Security
ALTER TABLE environment_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for environment_invitations
CREATE POLICY "Allow all operations on environment_invitations" ON environment_invitations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable realtime for environment_invitations
ALTER PUBLICATION supabase_realtime ADD TABLE environment_invitations;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_environment_invitations_email ON environment_invitations(email);
CREATE INDEX IF NOT EXISTS idx_environment_invitations_organization_id ON environment_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_environment_invitations_status ON environment_invitations(status);

-- ===========================================
-- STEP 8: CLEANUP EXPIRED INVITATIONS
-- ===========================================

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE environment_invitations
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 9: UPDATE EXISTING POLICIES
-- ===========================================

-- Update tasks policy to work with new environment_members structure
DROP POLICY IF EXISTS "Allow operations on own organization tasks" ON tasks;
CREATE POLICY "Allow operations on environment tasks" ON tasks
    FOR ALL
    USING (true)  -- Will be filtered by application logic
    WITH CHECK (true);

-- Update scores policy
DROP POLICY IF EXISTS "Allow operations on own organization scores" ON scores;
CREATE POLICY "Allow operations on environment scores" ON scores
    FOR ALL
    USING (true)  -- Will be filtered by application logic
    WITH CHECK (true);

-- ===========================================
-- STEP 10: ADD HELPER FUNCTIONS
-- ===========================================

-- Function to get environment members for a user
CREATE OR REPLACE FUNCTION get_user_environments(user_email TEXT)
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    display_name TEXT,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.name,
        em.display_name,
        (o.owner_id = em.user_id) as is_owner
    FROM environment_members em
    JOIN organizations o ON em.organization_id = o.id
    JOIN users u ON em.user_id = u.id
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Function to get environment members
CREATE OR REPLACE FUNCTION get_environment_members(org_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    display_name TEXT,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        em.display_name,
        (o.owner_id = u.id) as is_owner
    FROM environment_members em
    JOIN users u ON em.user_id = u.id
    JOIN organizations o ON em.organization_id = o.id
    WHERE em.organization_id = org_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- STEP 11: MIGRATION VERIFICATION
-- ===========================================

-- Verify migration completed successfully
DO $$
DECLARE
    mario_count INTEGER;
    maria_count INTEGER;
    member_count INTEGER;
BEGIN
    -- Check that users have emails
    SELECT COUNT(*) INTO mario_count FROM users WHERE username = 'mario' AND email IS NOT NULL;
    SELECT COUNT(*) INTO maria_count FROM users WHERE username = 'maria' AND email IS NOT NULL;

    -- Check that environment_members were created
    SELECT COUNT(*) INTO member_count FROM environment_members;

    -- Output results
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE 'Mario has email: %', mario_count > 0;
    RAISE NOTICE 'Maria has email: %', maria_count > 0;
    RAISE NOTICE 'Environment members created: %', member_count;

    IF mario_count = 0 OR maria_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: Users missing email addresses';
    END IF;

    IF member_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: No environment members created';
    END IF;
END $$;
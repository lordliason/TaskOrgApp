-- Migration: Add Member Colors to Organizations
-- Adds dynamic color assignment for organization members

-- Add member_colors field to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS member_colors JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN organizations.member_colors IS 'JSON object mapping user_id or username to color hex codes, e.g. {"user-id-1": "#4a9eff", "user-id-2": "#ff7eb3"}';

-- Add index for better performance on member_colors queries
CREATE INDEX IF NOT EXISTS idx_organizations_member_colors ON organizations USING GIN (member_colors);

-- Update existing organizations with default colors
-- This ensures backward compatibility
UPDATE organizations SET member_colors = '{
  "mario": "#4a9eff",
  "maria": "#ff7eb3",
  "both": "#a78bfa"
}'::jsonb WHERE member_colors = '{}'::jsonb OR member_colors IS NULL;
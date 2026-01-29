-- Migration: Remove legacy assignee values (mario, maria, both)
-- Date: 2026-01-29
-- Purpose: Convert all legacy string assignees to UUIDs or 'all'
-- 
-- This migration:
-- 1. Updates tasks with 'both' assignee to 'all'
-- 2. Updates tasks with legacy names ('mario', 'maria') to use the user's UUID
-- 3. Updates completed_by field similarly
-- 4. Updates any scores with legacy player names to use user_id

-- Step 1: Update 'both' to 'all' for assignee field
UPDATE tasks 
SET assignee = 'all', 
    assignee_id = NULL
WHERE assignee = 'both';

-- Step 2: For tasks with legacy 'mario' or 'maria' assignee, 
-- try to find matching user by username or display_name and update to their UUID
-- First, let's update assignee_id based on display_name match
UPDATE tasks t
SET assignee_id = u.id,
    assignee = u.id::text
FROM users u
WHERE t.assignee IN ('mario', 'maria')
  AND LOWER(u.display_name) = LOWER(t.assignee)
  AND t.organization_id = u.organization_id;

-- If no match by display_name, try username
UPDATE tasks t
SET assignee_id = u.id,
    assignee = u.id::text
FROM users u
WHERE t.assignee IN ('mario', 'maria')
  AND LOWER(u.username) = LOWER(t.assignee)
  AND t.organization_id = u.organization_id
  AND t.assignee_id IS NULL;

-- For any remaining legacy assignees, set to 'all'
UPDATE tasks
SET assignee = 'all',
    assignee_id = NULL
WHERE assignee IN ('mario', 'maria', 'both')
  AND assignee_id IS NULL;

-- Step 3: Update completed_by field similarly
-- Update 'both' to 'all'
UPDATE tasks
SET completed_by = 'all'
WHERE completed_by = 'both';

-- Update completed_by with UUID if we can match
UPDATE tasks t
SET completed_by = u.id::text
FROM users u
WHERE t.completed_by IN ('mario', 'maria')
  AND LOWER(u.display_name) = LOWER(t.completed_by)
  AND t.organization_id = u.organization_id;

UPDATE tasks t
SET completed_by = u.id::text
FROM users u
WHERE t.completed_by IN ('mario', 'maria')
  AND LOWER(u.username) = LOWER(t.completed_by)
  AND t.organization_id = u.organization_id
  AND LENGTH(t.completed_by) < 36;

-- For any remaining legacy completed_by, set to null (unknown who completed)
UPDATE tasks
SET completed_by = NULL
WHERE completed_by IN ('mario', 'maria', 'both')
  AND (completed_by IS NULL OR LENGTH(completed_by) < 36);

-- Step 4: Update scores table - add user_id if missing
-- First update based on player name matching display_name
UPDATE scores s
SET user_id = u.id
FROM users u
WHERE s.player IN ('mario', 'maria')
  AND LOWER(u.display_name) = LOWER(s.player)
  AND s.user_id IS NULL;

-- Then try username
UPDATE scores s
SET user_id = u.id
FROM users u
WHERE s.player IN ('mario', 'maria')
  AND LOWER(u.username) = LOWER(s.player)
  AND s.user_id IS NULL;

-- Update player field to use user_id for consistency
UPDATE scores
SET player = user_id::text
WHERE user_id IS NOT NULL
  AND player IN ('mario', 'maria');

-- Clean up any orphaned scores without user_id (legacy data that can't be matched)
-- Optionally delete these: DELETE FROM scores WHERE user_id IS NULL AND player IN ('mario', 'maria');
-- Or keep them but they won't show in leaderboard

-- Step 5: Verify the migration
-- Run these queries to check the results:
-- SELECT DISTINCT assignee FROM tasks WHERE assignee NOT IN ('all') AND LENGTH(assignee) < 36;
-- SELECT DISTINCT completed_by FROM tasks WHERE completed_by IS NOT NULL AND completed_by NOT IN ('all') AND LENGTH(completed_by) < 36;
-- SELECT DISTINCT player FROM scores WHERE player IN ('mario', 'maria');

-- Note: After running this migration, the application will only accept:
-- - 'all' for shared/team tasks
-- - UUID (36 character string with dashes) for individual member tasks

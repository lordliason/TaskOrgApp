-- Migration to Flexible Assignee System
-- Run this in Supabase SQL Editor to support any organization with any user names
-- This removes the hardcoded 'mario', 'maria', 'both' constraint

-- Drop the old restrictive constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_check;

-- FIX DATA BEFORE APPLYING NEW CONSTRAINT
-- 1. Convert 'both' to 'all'
UPDATE tasks SET assignee = 'all' WHERE assignee = 'both';

-- 2. Map legacy 'mario' and 'maria' names to IDs if assignee_id is NULL
-- This ensures they satisfy the (assignee = 'all' OR assignee_id IS NOT NULL) rule
UPDATE tasks SET assignee_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE assignee = 'mario' AND assignee_id IS NULL;

UPDATE tasks SET assignee_id = '550e8400-e29b-41d4-a716-446655440002' 
WHERE assignee = 'maria' AND assignee_id IS NULL;

-- 3. For any other tasks that don't satisfy the rule, set to 'all'
UPDATE tasks SET assignee = 'all' 
WHERE assignee != 'all' AND assignee_id IS NULL;

-- Add new flexible constraint
ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_check CHECK (
    assignee = 'all' OR 
    assignee_id IS NOT NULL
);

-- Note: The assignee column can now store any display name when assignee_id is set
-- The assignee_id column is the authoritative source for who the task is assigned to

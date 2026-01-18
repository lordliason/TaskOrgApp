-- Migration: Add location and update depends_on for task dependencies
-- Run this in Supabase SQL Editor

-- Add location column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;

-- Check if depends_on is an array type, and if so, change it to single UUID
DO $$ 
BEGIN
    -- Check if depends_on exists and is an array
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'depends_on'
        AND data_type = 'ARRAY'
    ) THEN
        -- Drop the old array column
        ALTER TABLE tasks DROP COLUMN depends_on;
        -- Add new single UUID column
        ALTER TABLE tasks ADD COLUMN depends_on UUID DEFAULT NULL;
    END IF;
    
    -- If depends_on doesn't exist at all, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'depends_on'
    ) THEN
        ALTER TABLE tasks ADD COLUMN depends_on UUID DEFAULT NULL;
    END IF;
END $$;

-- Add foreign key constraint for depends_on (task dependency)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_depends_on_task;
ALTER TABLE tasks ADD CONSTRAINT fk_depends_on_task 
    FOREIGN KEY (depends_on) 
    REFERENCES tasks(id) 
    ON DELETE SET NULL;

-- Create index for faster dependency lookups
CREATE INDEX IF NOT EXISTS idx_tasks_depends_on_single ON tasks(depends_on);
CREATE INDEX IF NOT EXISTS idx_tasks_location ON tasks(location);

-- Drop the old GIN index if it exists (was for array type)
DROP INDEX IF EXISTS idx_tasks_depends_on;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tasks' 
    AND column_name IN ('location', 'depends_on')
ORDER BY column_name;

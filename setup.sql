-- Task Matrix Database Setup
-- Run this in Supabase SQL Editor (Database > SQL Editor > New Query)

-- Create the tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    assignee TEXT NOT NULL CHECK (assignee IN ('mario', 'maria', 'both')),
    size TEXT NOT NULL CHECK (size IN ('xs', 's', 'm', 'l', 'xl')),
    urgent INTEGER DEFAULT 3 CHECK (urgent >= 1 AND urgent <= 5),
    important INTEGER DEFAULT 3 CHECK (important >= 1 AND important <= 5),
    completed BOOLEAN DEFAULT FALSE,
    completed_by TEXT CHECK (completed_by IS NULL OR completed_by IN ('mario', 'maria', 'both')),
    icon TEXT DEFAULT NULL,
    first_step TEXT DEFAULT NULL,
    completion_criteria TEXT DEFAULT NULL,
    deadline DATE DEFAULT NULL,
    depends_on UUID[] DEFAULT NULL,
    parent_task_id UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRATION SCRIPT (RUN THIS IF YOU ARE GETTING TYPE ERRORS)
-- This converts urgent/important columns from BOOLEAN to INTEGER (1-5 scale)

-- 1. Add completed column if missing
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- 2. Update assignee check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_check CHECK (assignee IN ('mario', 'maria', 'both'));

-- 3. Update urgent and important to integer
-- First, drop defaults
ALTER TABLE tasks ALTER COLUMN urgent DROP DEFAULT;
ALTER TABLE tasks ALTER COLUMN important DROP DEFAULT;

-- Convert boolean to integer (true -> 5, false -> 1)
-- If they are already integers, this might need adjustment, but usually they are booleans if failing.
ALTER TABLE tasks 
  ALTER COLUMN urgent TYPE INTEGER USING (CASE WHEN urgent::text = 'true' THEN 5 WHEN urgent::text = 'false' THEN 1 ELSE urgent::integer END),
  ALTER COLUMN important TYPE INTEGER USING (CASE WHEN important::text = 'true' THEN 5 WHEN important::text = 'false' THEN 1 ELSE important::integer END);

-- Add new check constraints and defaults
ALTER TABLE tasks ADD CONSTRAINT tasks_urgent_check CHECK (urgent >= 1 AND urgent <= 5);
ALTER TABLE tasks ADD CONSTRAINT tasks_important_check CHECK (important >= 1 AND important <= 5);
ALTER TABLE tasks ALTER COLUMN urgent SET DEFAULT 3;
ALTER TABLE tasks ALTER COLUMN important SET DEFAULT 3;

-- ADD ICON COLUMN (run this if you don't have the icon column yet)
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT NULL;

-- ADD COMPLETED_BY COLUMN (run this to add who completed the task)
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by TEXT;
-- ALTER TABLE tasks ADD CONSTRAINT tasks_completed_by_check CHECK (completed_by IS NULL OR completed_by IN ('mario', 'maria', 'both'));

-- ADD FIRST_STEP AND COMPLETION_CRITERIA COLUMNS (run this to add the new task properties)
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS first_step TEXT DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_criteria TEXT DEFAULT NULL;

-- ADD DEADLINE AND DEPENDENCY COLUMNS (for intelligent task decomposition)
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline DATE DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS depends_on UUID[] DEFAULT NULL;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID DEFAULT NULL;

-- CREATE SCORES TABLE (run this to add scoring system)
CREATE TABLE IF NOT EXISTS scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player TEXT NOT NULL CHECK (player IN ('mario', 'maria')),
    date DATE NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player, date)
);

-- Enable Row Level Security
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on scores" ON scores
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable realtime for the scores table
ALTER PUBLICATION supabase_realtime ADD TABLE scores;

-- Create index for faster queries
CREATE INDEX idx_scores_player_date ON scores(player, date DESC);
CREATE INDEX idx_scores_date ON scores(date DESC);


-- Enable Row Level Security (but allow all operations for public access)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (no login required)
CREATE POLICY "Allow all operations" ON tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add foreign key constraint for parent task relationship
ALTER TABLE tasks ADD CONSTRAINT fk_parent_task FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Enable realtime for the tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Create index for faster queries
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_depends_on ON tasks USING GIN(depends_on);


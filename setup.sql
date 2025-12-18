-- Task Matrix Database Setup
-- Run this in Supabase SQL Editor (Database > SQL Editor > New Query)

-- Create the tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    assignee TEXT NOT NULL CHECK (assignee IN ('you', 'wife', 'both')),
    size TEXT NOT NULL CHECK (size IN ('xs', 's', 'm', 'l', 'xl')),
    urgent BOOLEAN DEFAULT false,
    important BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (but allow all operations for public access)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (no login required)
CREATE POLICY "Allow all operations" ON tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Enable realtime for the tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Create index for faster queries
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);


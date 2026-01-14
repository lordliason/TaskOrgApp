-- Migration: Add Recurring Tasks Support
-- Run this in Supabase SQL Editor (Database > SQL Editor > New Query)

-- Add recurrence_rule column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT DEFAULT NULL;

-- Enable realtime replication on the new column
-- Note: Realtime is already enabled on the tasks table, so new columns are automatically included

-- No migration needed for existing tasks (they remain non-recurring with NULL recurrence_rule)
